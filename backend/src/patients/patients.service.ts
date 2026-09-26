import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { PatientEntity } from './entities/patient.entity';
import { DentalPhotoEntity } from './entities/dental-photo.entity';
import { BeforeAfterPairEntity } from './entities/before-after-pair.entity';
import { AttachedFileEntity } from './entities/attached-file.entity';
import { ToothRecordEntity } from '../odontogram/entities/tooth-record.entity';
import { CreatePatientDto } from './dto/create-patient.dto';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(PatientEntity)
    private readonly patientsRepo: Repository<PatientEntity>,
    @InjectRepository(DentalPhotoEntity)
    private readonly photosRepo: Repository<DentalPhotoEntity>,
    @InjectRepository(BeforeAfterPairEntity)
    private readonly pairsRepo: Repository<BeforeAfterPairEntity>,
    @InjectRepository(AttachedFileEntity)
    private readonly filesRepo: Repository<AttachedFileEntity>,
    @InjectRepository(ToothRecordEntity)
    private readonly teethRepo: Repository<ToothRecordEntity>,
  ) {}

  async findAll(clinicId?: string, search?: string): Promise<PatientEntity[]> {
    const baseWhere = clinicId ? { clinicId } : {};
    if (search) {
      return this.patientsRepo.find({
        where: [
          { ...baseWhere, firstName: ILike(`%${search}%`) },
          { ...baseWhere, lastName: ILike(`%${search}%`) },
          { ...baseWhere, phone: ILike(`%${search}%`) },
          { ...baseWhere, email: ILike(`%${search}%`) },
        ],
        relations: ['teeth'],
        order: { lastName: 'ASC', firstName: 'ASC' },
      });
    }
    return this.patientsRepo.find({
      where: baseWhere,
      relations: ['teeth'],
      order: { lastName: 'ASC', firstName: 'ASC' },
    });
  }

  async findOne(id: string): Promise<PatientEntity> {
    const patient = await this.patientsRepo.findOne({
      where: { id },
      relations: [
        'teeth',
        'teethSnapshots',
        'photos',
        'beforeAfterPairs',
        'treatmentLogs',
        'cleaningDues',
        'recommendedServices',
        'attachedFiles',
      ],
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    return patient;
  }

  async create(clinicId: string | undefined, dto: CreatePatientDto): Promise<PatientEntity> {
    const registeredDate = dto.registeredDate || new Date().toISOString().split('T')[0];

    const patient = this.patientsRepo.create({
      ...dto,
      clinicId,
      registeredDate,
      medicalAlerts: dto.medicalAlerts || [],
      allergies: dto.allergies || [],
    });

    const savedPatient = await this.patientsRepo.save(patient);

    // Initialize 32 healthy adult teeth records for the new patient
    const teethRecords: Partial<ToothRecordEntity>[] = [];
    for (let i = 1; i <= 32; i++) {
      teethRecords.push({
        patientId: savedPatient.id,
        toothNumber: i,
        condition: 'healthy',
        surfaces: [],
        mobility: 0,
        pocketDepthMm: 2,
      });
    }
    await this.teethRepo.save(teethRecords as any);

    return this.findOne(savedPatient.id);
  }

  async update(id: string, dto: Partial<CreatePatientDto>): Promise<PatientEntity> {
    const patient = await this.findOne(id);
    Object.assign(patient, dto);
    await this.patientsRepo.save(patient);
    return this.findOne(id);
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const patient = await this.findOne(id);
    await this.patientsRepo.remove(patient);
    return { success: true, message: `Patient ${patient.firstName} ${patient.lastName} deleted` };
  }

  // --- Photo management ---
  async addPhoto(patientId: string, photoData: Partial<DentalPhotoEntity>): Promise<DentalPhotoEntity> {
    await this.findOne(patientId);
    const photo = this.photosRepo.create({
      ...photoData,
      customerId: patientId,
      takenAt: photoData.takenAt || new Date().toISOString(),
    });
    return this.photosRepo.save(photo);
  }

  async deletePhoto(photoId: string): Promise<{ success: boolean }> {
    await this.photosRepo.delete(photoId);
    return { success: true };
  }

  // --- Before/After pair management ---
  async addBeforeAfterPair(patientId: string, pairData: Partial<BeforeAfterPairEntity>): Promise<BeforeAfterPairEntity> {
    await this.findOne(patientId);
    const pair = this.pairsRepo.create({
      ...pairData,
      customerId: patientId,
      dateCreated: pairData.dateCreated || new Date().toISOString(),
    });
    return this.pairsRepo.save(pair);
  }

  async deleteBeforeAfterPair(pairId: string): Promise<{ success: boolean }> {
    await this.pairsRepo.delete(pairId);
    return { success: true };
  }

  // --- Attached files ---
  async addAttachedFile(patientId: string, fileData: Partial<AttachedFileEntity>): Promise<AttachedFileEntity> {
    await this.findOne(patientId);
    const file = this.filesRepo.create({
      ...fileData,
      patientId,
      uploadDate: fileData.uploadDate || new Date().toISOString().split('T')[0],
    });
    return this.filesRepo.save(file);
  }

  async deleteAttachedFile(fileId: string): Promise<{ success: boolean }> {
    await this.filesRepo.delete(fileId);
    return { success: true };
  }
}

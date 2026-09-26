import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UserEntity } from '../../users/entities/user.entity';
import { DentalChairEntity } from '../../clinic-admin/entities/dental-chair.entity';
import { StaffShiftEntity } from '../../clinic-admin/entities/staff-shift.entity';
import { ConsumableItemEntity } from '../../clinic-admin/entities/consumable-item.entity';
import { TreatmentDeterminationEntity } from '../../clinic-admin/entities/treatment-determination.entity';
import { PatientEntity } from '../../patients/entities/patient.entity';
import { ToothRecordEntity } from '../../odontogram/entities/tooth-record.entity';
import { AppointmentEntity } from '../../appointments/entities/appointment.entity';
import {
  SEED_USERS,
  SEED_CHAIRS,
  SEED_SHIFTS,
  SEED_CONSUMABLES,
  SEED_DETERMINATIONS,
} from './initial-data';
import { DentalRulesService } from '../../rules/dental-rules.service';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    @InjectRepository(DentalChairEntity)
    private readonly chairsRepo: Repository<DentalChairEntity>,
    @InjectRepository(StaffShiftEntity)
    private readonly shiftsRepo: Repository<StaffShiftEntity>,
    @InjectRepository(ConsumableItemEntity)
    private readonly consumablesRepo: Repository<ConsumableItemEntity>,
    @InjectRepository(TreatmentDeterminationEntity)
    private readonly determinationsRepo: Repository<TreatmentDeterminationEntity>,
    @InjectRepository(PatientEntity)
    private readonly patientsRepo: Repository<PatientEntity>,
    @InjectRepository(ToothRecordEntity)
    private readonly teethRepo: Repository<ToothRecordEntity>,
    @InjectRepository(AppointmentEntity)
    private readonly appointmentsRepo: Repository<AppointmentEntity>,
    private readonly rulesService: DentalRulesService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    const autoSeed = this.configService.get<string>('AUTO_SEED_DATA', 'false') === 'true';
    if (autoSeed) {
      await this.seedAll();
    }
  }

  async seedAll() {
    this.logger.log('Checking database seed state (production mode)...');
    // Only seed standard determination categories if none exist, no sample users or sample patients
    await this.seedDeterminations();
    this.logger.log('Database seeding check complete (zero sample data).');
  }

  private async seedUsers() {
    for (const u of SEED_USERS) {
      const existing = await this.usersRepo.findOne({
        where: [{ email: u.email }, { username: u.username }],
      });
      if (!existing) {
        const passwordHash = await bcrypt.hash(u.password, 10);
        await this.usersRepo.save(
          this.usersRepo.create({
            email: u.email,
            username: u.username,
            name: u.name,
            passwordHash,
            role: u.role as any,
            title: u.title,
            avatarUrl: u.avatarUrl,
          }),
        );
        this.logger.log(`Seeded user: ${u.username}`);
      }
    }
  }

  private async seedChairs() {
    for (const chair of SEED_CHAIRS) {
      const existing = await this.chairsRepo.findOne({ where: { id: chair.id } });
      if (!existing) {
        await this.chairsRepo.save(this.chairsRepo.create(chair as any));
        this.logger.log(`Seeded dental chair: ${chair.name}`);
      }
    }
  }

  private async seedShifts() {
    for (const shift of SEED_SHIFTS) {
      const existing = await this.shiftsRepo.findOne({ where: { id: shift.id } });
      if (!existing) {
        await this.shiftsRepo.save(this.shiftsRepo.create(shift as any));
        this.logger.log(`Seeded staff shift for: ${shift.doctorName}`);
      }
    }
  }

  private async seedConsumables() {
    for (const item of SEED_CONSUMABLES) {
      const existing = await this.consumablesRepo.findOne({ where: { id: item.id } });
      if (!existing) {
        await this.consumablesRepo.save(this.consumablesRepo.create(item));
        this.logger.log(`Seeded consumable: ${item.name}`);
      }
    }
  }

  private async seedDeterminations() {
    for (const det of SEED_DETERMINATIONS) {
      const existing = await this.determinationsRepo.findOne({ where: { id: det.id } });
      if (!existing) {
        await this.determinationsRepo.save(this.determinationsRepo.create(det as any));
        this.logger.log(`Seeded determination: ${det.treatmentName}`);
      }
    }
  }

  private async seedInitialPatients() {
    const count = await this.patientsRepo.count();
    if (count > 0) return;

    this.logger.log('Seeding demo patient with clinical odontogram & appointments...');

    const patient = await this.patientsRepo.save(
      this.patientsRepo.create({
        firstName: 'Eleanor',
        lastName: 'Vance',
        dob: '1988-04-12',
        gender: 'Female',
        phone: '+63 917 555 4321',
        email: 'eleanor.vance@example.com',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        registeredDate: '2023-01-15',
        medicalAlerts: ['Hypertension (Stage 1 - Controlled)', 'Mitral Valve Prolapse'],
        allergies: ['Penicillin / Amoxicillin', 'Latex'],
        insuranceProvider: 'MaxiCare Health Dental Gold',
        emergencyContact: {
          name: 'Arthur Vance',
          phone: '+63 918 555 1234',
          relation: 'Spouse',
        },
      }),
    );

    // Seed 32 universal teeth for this patient
    const teethRecords: Partial<ToothRecordEntity>[] = [];
    for (let num = 1; num <= 32; num++) {
      let condition: any = 'healthy';
      let surfaces: any = [];
      let notes = '';

      if (num === 1 || num === 16 || num === 17 || num === 32) {
        condition = 'growing_impacted';
        notes = 'Partially erupted 3rd molar with pericoronal mucosal flap.';
      } else if (num === 3) {
        condition = 'filling';
        surfaces = ['occlusal', 'mesial'];
        notes = 'Class II composite restoration in good clinical margins.';
      } else if (num === 14) {
        condition = 'small_cavity';
        surfaces = ['occlusal'];
        notes = 'Early enamel fissure caries, sticky to explorer.';
      } else if (num === 19) {
        condition = 'large_cavity';
        surfaces = ['occlusal', 'distal'];
        notes = 'Deep dentinal caries near pulp horn.';
      } else if (num === 30) {
        condition = 'root_canal';
        surfaces = ['occlusal'];
        notes = 'Treated root canal needing permanent crown placement.';
      }

      teethRecords.push({
        patientId: patient.id,
        toothNumber: num,
        condition,
        surfaces,
        notes,
        mobility: 0,
        pocketDepthMm: 2,
      });
    }

    await this.teethRepo.save(teethRecords as any);

    // Seed sample appointment
    const today = new Date().toISOString().split('T')[0];
    await this.appointmentsRepo.save(
      this.appointmentsRepo.create({
        customerId: patient.id,
        customerName: `${patient.firstName} ${patient.lastName}`,
        customerPhone: patient.phone,
        customerEmail: patient.email,
        date: today,
        startTime: '10:00',
        durationMinutes: 45,
        endTime: '10:45',
        doctorName: 'Dr. Aris Thorne, DDS',
        operatory: 'Operatory 2 (Restorative & Endodontics)',
        procedureCategory: 'Restorative',
        procedureName: 'Composite Restoration & Odontogram Review',
        relatedTeeth: [14, 19],
        status: 'confirmed',
        notes: 'Pre-medicated with Clindamycin 600mg due to penicillin allergy.',
        reminderPreference: 'both',
        automatedRemindersEnabled: true,
      }),
    );

    this.logger.log(`Sample patient Eleanor Vance seeded with 32-tooth odontogram!`);
  }
}

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { ClinicEntity } from './entities/clinic.entity';
import { UserEntity } from '../users/entities/user.entity';
import { RegisterStaffDto, UpdateStaffDto } from './dto/register-staff.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';

@Injectable()
export class ClinicsService {
  private readonly logger = new Logger(ClinicsService.name);

  constructor(
    @InjectRepository(ClinicEntity)
    private readonly clinicRepo: Repository<ClinicEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async getProfile(clinicId: string): Promise<ClinicEntity> {
    const clinic = await this.clinicRepo.findOne({
      where: { id: clinicId },
    });
    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }
    return clinic;
  }

  async updateProfile(clinicId: string, dto: UpdateClinicDto): Promise<ClinicEntity> {
    const clinic = await this.getProfile(clinicId);
    Object.assign(clinic, dto);
    return this.clinicRepo.save(clinic);
  }

  async getStaff(clinicId: string): Promise<Omit<UserEntity, 'passwordHash' | 'refreshTokens'>[]> {
    const staff = await this.userRepo.find({
      where: { clinicId },
      order: { createdAt: 'ASC' },
    });
    return staff.map(({ passwordHash, refreshTokens, ...user }) => user as any);
  }

  async registerStaff(clinicId: string, dto: RegisterStaffDto): Promise<Omit<UserEntity, 'passwordHash' | 'refreshTokens'>> {
    // 1. Verify clinic exists
    const clinic = await this.clinicRepo.findOne({ where: { id: clinicId } });
    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }

    // 2. Check if username or email is already taken
    const existing = await this.userRepo.findOne({
      where: [
        { email: dto.email.toLowerCase().trim() },
        { username: dto.username.toLowerCase().trim() },
      ],
    });
    if (existing) {
      throw new ConflictException('A staff account with this email or username already exists');
    }

    // 3. Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Default permissions according to role if none supplied
    let permissions = dto.permissions;
    if (!permissions || permissions.length === 0) {
      if (dto.role === 'admin') {
        permissions = [
          'patients',
          'appointments',
          'charting',
          'treatments',
          'photography',
          'recommendations',
          'presentation',
          'inventory',
          'admin_view',
        ];
      } else if (dto.role === 'dentist') {
        permissions = [
          'patients',
          'appointments',
          'charting',
          'treatments',
          'photography',
          'recommendations',
          'presentation',
        ];
      } else if (dto.role === 'hygienist') {
        permissions = ['patients', 'appointments', 'charting', 'treatments'];
      } else if (dto.role === 'receptionist') {
        permissions = ['patients', 'appointments'];
      } else {
        permissions = ['patients', 'appointments', 'charting'];
      }
    }

    const newUser = this.userRepo.create({
      clinicId,
      name: dto.name.trim(),
      email: dto.email.toLowerCase().trim(),
      username: dto.username.toLowerCase().trim(),
      passwordHash,
      role: dto.role,
      title: dto.title || (dto.role === 'admin' ? 'Clinic Administrator' : 'Staff Practitioner'),
      permissions,
      status: 'active',
      avatarUrl: dto.avatarUrl,
    });

    const saved = await this.userRepo.save(newUser);
    this.logger.log(`Staff registered: ${saved.username} (${saved.role}) for clinic ${clinic.name}`);

    const { passwordHash: _, refreshTokens: __, ...userProfile } = saved;
    return userProfile as any;
  }

  async updateStaff(
    clinicId: string,
    staffId: string,
    dto: UpdateStaffDto,
  ): Promise<Omit<UserEntity, 'passwordHash' | 'refreshTokens'>> {
    const staff = await this.userRepo.findOne({
      where: { id: staffId, clinicId },
    });
    if (!staff) {
      throw new NotFoundException('Staff member not found in this clinic');
    }

    if (dto.name !== undefined) staff.name = dto.name;
    if (dto.role !== undefined) staff.role = dto.role;
    if (dto.title !== undefined) staff.title = dto.title;
    if (dto.permissions !== undefined) staff.permissions = dto.permissions;
    if (dto.status !== undefined) staff.status = dto.status;

    const updated = await this.userRepo.save(staff);
    const { passwordHash: _, refreshTokens: __, ...userProfile } = updated;
    return userProfile as any;
  }

  async resetStaffPassword(clinicId: string, staffId: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    const staff = await this.userRepo.findOne({
      where: { id: staffId, clinicId },
    });
    if (!staff) {
      throw new NotFoundException('Staff member not found in this clinic');
    }

    staff.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.userRepo.save(staff);

    return { success: true, message: `Password reset successfully for staff ${staff.username}` };
  }

  async deleteStaff(clinicId: string, staffId: string): Promise<{ success: boolean; message: string }> {
    const staff = await this.userRepo.findOne({
      where: { id: staffId, clinicId },
    });
    if (!staff) {
      throw new NotFoundException('Staff member not found in this clinic');
    }

    await this.userRepo.remove(staff);
    return { success: true, message: 'Staff member removed successfully' };
  }
}

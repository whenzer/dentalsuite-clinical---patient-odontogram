import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { ClinicEntity } from '../clinics/entities/clinic.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  username?: string;
  role: string;
  clinicId?: string;
  type?: 'clinic' | 'staff';
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(ClinicEntity)
    private readonly clinicsRepository: Repository<ClinicEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        'JWT_ACCESS_SECRET',
        'super_secret_clinical_access_jwt_key_32chars_min_replace_in_prod!',
      ),
    });
  }

  async validate(payload: JwtPayload) {
    // 1. Check if token belongs to a Clinic Organization Account
    if (payload.type === 'clinic') {
      const clinic = await this.clinicsRepository.findOne({
        where: { id: payload.sub },
      });
      if (!clinic) {
        throw new UnauthorizedException('Clinic account no longer exists or session is invalid');
      }
      return {
        id: clinic.id,
        clinicId: clinic.id,
        email: clinic.email,
        name: clinic.name,
        role: 'clinic_admin',
        type: 'clinic',
        permissions: ['all', 'admin_view', 'patients', 'appointments', 'charting', 'treatments', 'photography'],
      };
    }

    // 2. Check if token belongs to a Staff Member Account
    const user = await this.usersRepository.findOne({
      where: { id: payload.sub },
      relations: ['clinic'],
    });

    if (user) {
      if (user.status === 'inactive') {
        throw new UnauthorizedException('Staff account is inactive');
      }
      return {
        id: user.id,
        clinicId: user.clinicId,
        clinicName: user.clinic?.name,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        title: user.title,
        avatarUrl: user.avatarUrl,
        permissions: user.permissions || [],
        type: 'staff',
      };
    }

    // 3. Fallback: check clinics in case type wasn't explicitly tagged
    const fallbackClinic = await this.clinicsRepository.findOne({
      where: { id: payload.sub },
    });
    if (fallbackClinic) {
      return {
        id: fallbackClinic.id,
        clinicId: fallbackClinic.id,
        email: fallbackClinic.email,
        name: fallbackClinic.name,
        role: 'clinic_admin',
        type: 'clinic',
        permissions: ['all'],
      };
    }

    throw new UnauthorizedException('Account no longer exists or session is invalid');
  }
}

import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from '../users/entities/user.entity';
import { RefreshTokenEntity } from '../auth/entities/refresh-token.entity';
import { PatientEntity } from '../patients/entities/patient.entity';
import { DentalPhotoEntity } from '../patients/entities/dental-photo.entity';
import { BeforeAfterPairEntity } from '../patients/entities/before-after-pair.entity';
import { AttachedFileEntity } from '../patients/entities/attached-file.entity';
import { ToothRecordEntity } from '../odontogram/entities/tooth-record.entity';
import { TeethSnapshotEntity } from '../odontogram/entities/teeth-snapshot.entity';
import { MaintenanceDueEntity } from '../odontogram/entities/maintenance-due.entity';
import { RecommendedServiceEntity } from '../odontogram/entities/recommended-service.entity';
import { TreatmentLogEntity } from '../treatments/entities/treatment-log.entity';
import { AppointmentEntity } from '../appointments/entities/appointment.entity';
import { AppointmentReminderLogEntity } from '../appointments/entities/appointment-reminder-log.entity';
import { DentalChairEntity } from '../clinic-admin/entities/dental-chair.entity';
import { StaffShiftEntity } from '../clinic-admin/entities/staff-shift.entity';
import { ConsumableItemEntity } from '../clinic-admin/entities/consumable-item.entity';
import { TreatmentDeterminationEntity } from '../clinic-admin/entities/treatment-determination.entity';

export const getTypeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const databaseUrl = configService.get<string>('DATABASE_URL');
  const isProd = configService.get<string>('NODE_ENV') === 'production';
  const shouldSync = configService.get<string>('TYPEORM_SYNCHRONIZE', 'true') === 'true';
  const logging = configService.get<string>('TYPEORM_LOGGING', 'false') === 'true';

  const entities = [
    UserEntity,
    RefreshTokenEntity,
    PatientEntity,
    DentalPhotoEntity,
    BeforeAfterPairEntity,
    AttachedFileEntity,
    ToothRecordEntity,
    TeethSnapshotEntity,
    MaintenanceDueEntity,
    RecommendedServiceEntity,
    TreatmentLogEntity,
    AppointmentEntity,
    AppointmentReminderLogEntity,
    DentalChairEntity,
    StaffShiftEntity,
    ConsumableItemEntity,
    TreatmentDeterminationEntity,
  ];

  // If Supabase connection URI is supplied
  if (databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
      entities,
      synchronize: shouldSync,
      logging,
      ssl: {
        rejectUnauthorized: false, // Required for cloud Supabase pooler / direct connection
      },
      extra: {
        max: 20,
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000,
      },
    };
  }

  // Individual parameters fallback
  const isSsl = configService.get<string>('DB_SSL', 'true') === 'true';
  const rejectUnauthorized =
    configService.get<string>('DB_REJECT_UNAUTHORIZED', 'false') === 'true';

  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: parseInt(configService.get<string>('DB_PORT', '5432'), 10),
    username: configService.get<string>('DB_USERNAME', 'postgres'),
    password: configService.get<string>('DB_PASSWORD', 'postgres'),
    database: configService.get<string>('DB_NAME', 'postgres'),
    entities,
    synchronize: shouldSync,
    logging,
    ssl: isSsl ? { rejectUnauthorized } : false,
  };
};

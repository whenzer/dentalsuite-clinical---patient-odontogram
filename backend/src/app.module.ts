import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PatientsModule } from './patients/patients.module';
import { ClinicsModule } from './clinics/clinics.module';
import { OdontogramModule } from './odontogram/odontogram.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { TreatmentsModule } from './treatments/treatments.module';
import { ClinicAdminModule } from './clinic-admin/clinic-admin.module';
import { RealtimeModule } from './realtime/realtime.module';
import { RulesModule } from './rules/rules.module';
import { TokenValidationMiddleware } from './common/middleware/token-validation.middleware';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    PatientsModule,
    ClinicsModule,
    OdontogramModule,
    AppointmentsModule,
    TreatmentsModule,
    ClinicAdminModule,
    RealtimeModule,
    RulesModule,
  ],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Mount the token validation middleware globally across all /api/v1 routes
    consumer
      .apply(TokenValidationMiddleware)
      .exclude(
        { path: 'api/v1/auth/login', method: RequestMethod.POST },
        { path: 'api/v1/auth/register', method: RequestMethod.POST },
        { path: 'api/v1/auth/refresh', method: RequestMethod.POST },
        { path: 'api/v1/health', method: RequestMethod.GET },
      )
      .forRoutes({ path: 'api/v1/*', method: RequestMethod.ALL });
  }
}

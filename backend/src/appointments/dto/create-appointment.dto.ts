import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsArray,
  IsIn,
  IsBoolean,
} from 'class-validator';
import { AppointmentStatus, ReminderType } from '../entities/appointment.entity';

export class CreateAppointmentDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @IsString()
  @IsNotEmpty()
  customerEmail: string;

  @IsString()
  @IsNotEmpty()
  date: string; // YYYY-MM-DD

  @IsString()
  @IsNotEmpty()
  startTime: string; // HH:mm

  @IsNumber()
  durationMinutes: number;

  @IsString()
  @IsNotEmpty()
  endTime: string; // HH:mm

  @IsString()
  @IsNotEmpty()
  doctorName: string;

  @IsString()
  @IsNotEmpty()
  operatory: string;

  @IsString()
  @IsNotEmpty()
  procedureCategory: string;

  @IsString()
  @IsNotEmpty()
  procedureName: string;

  @IsOptional()
  @IsArray()
  relatedTeeth?: number[];

  @IsOptional()
  @IsIn(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'])
  status?: AppointmentStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsIn(['email', 'sms', 'both'])
  reminderPreference?: ReminderType;

  @IsOptional()
  @IsBoolean()
  automatedRemindersEnabled?: boolean;
}

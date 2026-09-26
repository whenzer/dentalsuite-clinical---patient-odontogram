import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  IsOptional,
  IsIn,
} from 'class-validator';

export class CreateTreatmentLogDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  doctorName: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  procedureName: string;

  @IsArray()
  teethInvolved: number[];

  @IsString()
  clinicalNotes: string;

  @IsNumber()
  cost: number;

  @IsOptional()
  @IsIn(['Completed', 'In Progress', 'Planned'])
  status?: 'Completed' | 'In Progress' | 'Planned';

  @IsOptional()
  @IsString()
  snapshotId?: string;

  @IsOptional()
  @IsString()
  urgencyGroup?: 'Emergency' | 'LongProcedure' | 'MaintenanceElective';

  @IsOptional()
  @IsNumber()
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  determinationId?: string;

  @IsOptional()
  @IsArray()
  consumables?: any[];

  @IsOptional()
  @IsNumber()
  minAmountPhp?: number;

  @IsOptional()
  @IsNumber()
  maxAmountPhp?: number;
}

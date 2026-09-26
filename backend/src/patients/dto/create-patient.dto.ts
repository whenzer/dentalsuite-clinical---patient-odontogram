import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsIn,
  IsArray,
} from 'class-validator';

export class CreatePatientDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  dob: string; // YYYY-MM-DD

  @IsIn(['Male', 'Female', 'Other'])
  gender: 'Male' | 'Female' | 'Other';

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  registeredDate?: string;

  @IsOptional()
  @IsArray()
  medicalAlerts?: string[];

  @IsOptional()
  @IsArray()
  allergies?: string[];

  @IsOptional()
  @IsString()
  insuranceProvider?: string;

  @IsOptional()
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
}

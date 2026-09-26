import {
  IsNumber,
  IsString,
  IsArray,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { ToothCondition, ToothNumber, ToothSurface } from '../../rules/dental-rules.service';

export class UpdateToothDto {
  @IsNumber()
  @Min(1)
  @Max(32)
  number: ToothNumber;

  @IsString()
  condition: ToothCondition;

  @IsArray()
  surfaces: ToothSurface[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(3)
  mobility?: 0 | 1 | 2 | 3;

  @IsOptional()
  @IsNumber()
  pocketDepthMm?: number;

  @IsOptional()
  @IsString()
  lastTreatedDate?: string;

  @IsOptional()
  surfaceColors?: Record<string, string>;
}

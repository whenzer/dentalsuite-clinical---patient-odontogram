import { SetMetadata } from '@nestjs/common';

export type AppRole =
  | 'admin'
  | 'dentist'
  | 'receptionist'
  | 'hygienist'
  | 'assistant'
  | 'clinic_admin'
  | string;

export const ROLES_KEY = 'roles';
export const Roles = (...roles: AppRole[]) =>
  SetMetadata(ROLES_KEY, roles);

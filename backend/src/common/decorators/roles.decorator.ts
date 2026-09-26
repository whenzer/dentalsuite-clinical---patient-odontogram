import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: ('admin' | 'dentist' | 'receptionist')[]) =>
  SetMetadata(ROLES_KEY, roles);

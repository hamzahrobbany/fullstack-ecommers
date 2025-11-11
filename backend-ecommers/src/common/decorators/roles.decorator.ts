import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export type RoleValue =
  | 'OWNER'
  | 'ADMIN'
  | 'CUSTOMER'
  | (string & {});

export const Roles = (...roles: RoleValue[]) => SetMetadata(ROLES_KEY, roles);

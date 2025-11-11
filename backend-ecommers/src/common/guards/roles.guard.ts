import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY, RoleValue } from '@/common/decorators/roles.decorator';

interface RoleAwareRequest {
  user?: {
    role?: string | null;
  };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleValue[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RoleAwareRequest>();
    const userRole = request.user?.role;

    if (!userRole) {
      throw new ForbiddenException('Peran pengguna tidak ditemukan.');
    }

    const normalizedRole = String(userRole).toUpperCase();
    const isAuthorized = requiredRoles.some(
      (role) => String(role).toUpperCase() === normalizedRole,
    );

    if (!isAuthorized) {
      throw new ForbiddenException('Akses ditolak untuk peran ini.');
    }

    return true;
  }
}

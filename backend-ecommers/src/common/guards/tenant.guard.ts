import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request & { tenantId?: string }>();
    if (!req.tenantId) {
      throw new ForbiddenException('Tenant context not found');
    }
    return true;
  }
}

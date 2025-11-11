import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

import { TenantsService } from '@/modules/tenants/tenants.service';
import type { Tenant } from '@/modules/tenants/entities/tenant.entity';

interface TenantAwareRequest extends Request {
  user?: { tenantId?: string | null };
  tenant?: Tenant | null;
  tenantId?: string | null;
}

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly tenantsService: TenantsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<TenantAwareRequest>();

    if (request.tenantId) {
      return true;
    }

    const identifier =
      this.normalizeIdentifier(request.headers['x-tenant-id']) ??
      this.normalizeIdentifier(request.headers['x-tenant-code']) ??
      this.normalizeIdentifier(request.headers['x-tenant']) ??
      this.normalizeIdentifier(request.headers['tenant']) ??
      this.normalizeIdentifier(request.user?.tenantId);

    if (!identifier) {
      throw new ForbiddenException('Tenant context tidak ditemukan.');
    }

    const tenant = await this.resolveTenant(identifier);
    request.tenant = tenant;
    request.tenantId = tenant.id;

    if (request.user) {
      request.user.tenantId = tenant.id;
    }

    return true;
  }

  private normalizeIdentifier(value?: string | string[] | null): string | null {
    if (Array.isArray(value)) {
      return value.length ? this.normalizeIdentifier(value[0]) : null;
    }

    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed.toLowerCase() : null;
  }

  private async resolveTenant(identifier: string): Promise<Tenant> {
    const resolvers: Array<() => Promise<Tenant>> = [
      () => this.tenantsService.findById(identifier),
      () => this.tenantsService.findByCode(identifier),
      () => this.tenantsService.findByDomain(identifier),
    ];

    for (const resolver of resolvers) {
      try {
        const tenant = await resolver();
        if (tenant) {
          return tenant;
        }
      } catch (error) {
        // Ignore and try next resolver
      }
    }

    throw new ForbiddenException(`Tenant tidak ditemukan: ${identifier}`);
  }
}

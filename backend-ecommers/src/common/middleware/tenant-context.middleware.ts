import {
  BadRequestException,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import type { NextFunction, Response } from 'express';
import { TenantsService } from '@/modules/tenants/tenants.service';
import type { Tenant } from '@/modules/tenants/entities/tenant.entity';

type HeadersRecord = Record<string, string | string[] | undefined>;

interface TenantCarrier {
  tenant?: Tenant | null;
  tenantId?: string | null;
}

interface RequestLike extends TenantCarrier {
  headers?: HeadersRecord;
  cookies?: Record<string, string>;
  url?: string;
  originalUrl?: string;
  method?: string;
  user?: TenantCarrier & Record<string, unknown>;
  raw?: (TenantCarrier & {
    headers?: HeadersRecord;
    cookies?: Record<string, string>;
    url?: string;
    originalUrl?: string;
  }) &
    Record<string, unknown>;
}

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  private readonly publicRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/tenants/register',
    '/api/docs',
    '/api-json',
    '/swagger-ui',
    '/favicon',
  ];

  constructor(private readonly tenantsService: TenantsService) {}

  async use(
    req: RequestLike,
    res: Response | Record<string, unknown>,
    next: NextFunction,
  ): Promise<void> {
    const path = this.getRequestPath(req).toLowerCase();

    if (this.isPublicRoute(path)) {
      this.attachTenant(req, null);
      return next();
    }

    const tenantId =
      this.getTenantIdFromHeader(req) ?? this.getTenantIdFromCookie(req);

    console.log(`[TenantMiddleware] ${req.method} ${path} | TenantID:`, tenantId);

    if (!tenantId) {
      this.attachTenant(req, null);
      return next(new BadRequestException('Tenant context tidak ditemukan'));
    }

    try {
      // 🧠 Deteksi UUID vs Code
      const isUuid = /^[0-9a-fA-F-]{36}$/.test(tenantId);
      const tenant = isUuid
        ? await this.tenantsService.findById(tenantId)
        : await this.tenantsService.findByCode(tenantId);

      if (!tenant) {
        this.attachTenant(req, null);
        return next(
          new BadRequestException(
            `Tenant tidak valid atau tidak ditemukan (ID/Code: ${tenantId})`,
          ),
        );
      }

      this.attachTenant(req, tenant);
      console.log('✅ TenantContextMiddleware aktif:', tenant.id, tenant.code);
      return next();
    } catch (error) {
      console.error('❌ TenantContextMiddleware error:', error);
      this.attachTenant(req, null);
      return next(new BadRequestException('Tenant tidak valid'));
    }
  }

  private isPublicRoute(path: string): boolean {
    return this.publicRoutes.some(
      (route) => path === route || path.startsWith(`${route}/`),
    );
  }

  private getTenantIdFromHeader(req: RequestLike): string | null {
    const headers: HeadersRecord = req.headers ?? {};
    const header = headers['x-tenant-id'] ?? headers['X-Tenant-ID'];
    return Array.isArray(header)
      ? this.normalizeIdentifier(header[0])
      : this.normalizeIdentifier(header as string);
  }

  private getTenantIdFromCookie(req: RequestLike): string | null {
    if (req.cookies?.tenant_id) {
      return this.normalizeIdentifier(req.cookies.tenant_id);
    }
    const cookieHeader = (req.headers ?? {})['cookie'];
    if (typeof cookieHeader === 'string') {
      const cookies = cookieHeader.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.split('=').map((part) => part?.trim());
        if (name === 'tenant_id' && value) {
          return this.normalizeIdentifier(decodeURIComponent(value));
        }
      }
    }
    return null;
  }

  private attachTenant(req: RequestLike, tenant: Tenant | null) {
    const tenantId = tenant?.id ?? null;
    req.tenant = tenant;
    req.tenantId = tenantId;
    if (req.raw) Object.assign(req.raw, { tenant, tenantId });
    if (req.user) Object.assign(req.user, { tenant, tenantId });
  }

  private normalizeIdentifier(value?: string | null): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private getRequestPath(req: RequestLike): string {
    const rawUrl = req.raw?.url;
    const url =
      req.originalUrl ?? req.url ?? (typeof rawUrl === 'string' ? rawUrl : '') ?? '';
    if (!url) return '/';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        return new URL(url).pathname || '/';
      } catch {
        return '/';
      }
    }
    return url.startsWith('/') ? url : `/${url}`;
  }
}

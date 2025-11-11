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
  /**
   * Rute publik yang tidak memerlukan tenant context.
   * Gunakan lowercase untuk mempermudah pencocokan.
   */

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

  /**
   * Middleware utama yang menempelkan tenant ke setiap request.
   * Prioritas sumber tenant: Header `X-Tenant-ID` → Cookie `tenant_id`.
   */
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

    if (!tenantId) {
      this.attachTenant(req, null);
      return next(new BadRequestException('Tenant tidak valid'));
    }

    try {
      const tenant = (await this.tenantsService.findById(tenantId)) as Tenant;
      this.attachTenant(req, tenant);

      console.log('TenantContextMiddleware aktif:', tenantId);
      return next();
    } catch {
      this.attachTenant(req, null);
      return next(new BadRequestException('Tenant tidak valid'));
    }
  }

  /**
   * Menentukan apakah rute saat ini merupakan rute publik.
   */
  private isPublicRoute(path: string): boolean {
    return this.publicRoutes.some(
      (route) => path === route || path.startsWith(`${route}/`),
    );
  }

  /**
   * Mengambil tenantId dari header.
   */
  private getTenantIdFromHeader(req: RequestLike): string | null {
    const headers: HeadersRecord = req.headers ?? {};
    const header = headers['x-tenant-id'] ?? headers['X-Tenant-ID'];

    if (Array.isArray(header)) {
      return this.normalizeIdentifier(header[0]);
    }

    return this.normalizeIdentifier(header as string);
  }

  /**
   * Mengambil tenantId dari cookie `tenant_id`.
   */
  private getTenantIdFromCookie(req: RequestLike): string | null {
    if (req.cookies && typeof req.cookies.tenant_id === 'string') {
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

  /**
   * Menempelkan tenant ke request (Express & Fastify).
   */
  private attachTenant(req: RequestLike, tenant: Tenant | null) {
    const tenantId = tenant?.id ?? null;

    req.tenant = tenant;
    req.tenantId = tenantId;

    if (req.raw) {
      req.raw.tenant = tenant;
      req.raw.tenantId = tenantId;
    }

    if (req.user) {
      req.user.tenant = tenant;
      req.user.tenantId = tenantId;
    }
  }

  /**
   * Normalisasi tenantId agar tidak ada whitespace kosong.
   */
  private normalizeIdentifier(value?: string | null): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  /**
   * Mendapatkan path dari request (berfungsi untuk Express & Fastify).
   */
  private getRequestPath(req: RequestLike): string {
    const rawUrl = req.raw?.url;
    const url =
      req.originalUrl ??
      req.url ??
      (typeof rawUrl === 'string' ? rawUrl : '') ??
      '';

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

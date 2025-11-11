import {
  BadRequestException,
  Injectable,
  Logger,
  NestMiddleware,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { TenantsService } from '@/modules/tenants/tenants.service';
import type { Tenant } from '@/modules/tenants/entities/tenant.entity';

export interface TenantCarrier {
  tenant?: Tenant | null;
  tenantId?: string | null;
}

type HeadersRecord = Record<string, string | string[] | undefined>;

type FastifyLikeRequest = {
  headers?: HeadersRecord;
  cookies?: Record<string, string>;
  originalUrl?: string;
  url?: string;
  method?: string;
  raw?: (TenantCarrier &
    Record<string, unknown> & {
      headers?: HeadersRecord;
      cookies?: Record<string, string>;
      originalUrl?: string;
      url?: string;
      method?: string;
      user?: TenantCarrier & Record<string, unknown>;
    }) | null;
  user?: (TenantCarrier & Record<string, unknown>) | null;
};

export type TenantAwareRequest = Partial<Request> & FastifyLikeRequest & TenantCarrier;

type ResponseLike = Response | Record<string, unknown>;

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantContextMiddleware.name);

  private readonly publicRouteMatchers: RegExp[] = [
    /^\/?$/i,
    /^\/api\/(auth)(\/|$)/i,
    /^\/api\/(tenants)(\/|$)/i,
    /^\/api\/(debug)(\/|$)/i,
    /^\/api\/(docs)(\/|$)/i,
    /^\/api\/(docs-json)(\/|$)/i,
    /^\/api-json(\/|$)/i,
    /^\/swagger-ui(\/|$)/i,
    /^\/favicon(\.ico)?$/i,
  ];

  constructor(private readonly tenantsService: TenantsService) {}

  async use(
    req: TenantAwareRequest,
    _res: ResponseLike,
    next: NextFunction,
  ): Promise<void> {
    const method = this.getRequestMethod(req);
    const path = this.getRequestPath(req);

    if (this.isPublicRoute(path) || method === 'OPTIONS') {
      this.attachTenant(req, null);
      this.logger.debug(`${method} ${path} | public route, skipping tenant context`);
      return next();
    }

    const tenantIdentifier =
      this.getTenantIdFromHeader(req) ?? this.getTenantIdFromCookie(req);

    this.logger.debug(
      `${method} ${path} | tenant identifier: ${tenantIdentifier ?? 'none'}`,
    );

    if (!tenantIdentifier) {
      this.attachTenant(req, null);
      return next(new BadRequestException('Tenant context tidak ditemukan'));
    }

    try {
      const tenant = await this.resolveTenant(tenantIdentifier);

      if (!tenant) {
        this.attachTenant(req, null);
        return next(
          new BadRequestException(
            `Tenant tidak valid atau tidak ditemukan (ID/Code: ${tenantIdentifier})`,
          ),
        );
      }

      this.attachTenant(req, tenant);
      this.logger.debug(
        `${method} ${path} | tenant resolved => ${tenant.id} (${tenant.code})`,
      );
      return next();
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `TenantContextMiddleware error: ${err.message}`,
        err.stack ?? undefined,
      );
      this.attachTenant(req, null);
      return next(new BadRequestException('Tenant tidak valid'));
    }
  }

  private isPublicRoute(path: string): boolean {
    return this.publicRouteMatchers.some((pattern) => pattern.test(path));
  }

  private getRequestMethod(req: TenantAwareRequest): string {
    const method =
      req.method ??
      (typeof req.raw === 'object' && req.raw && 'method' in req.raw
        ? String((req.raw as { method?: string }).method)
        : undefined) ??
      'GET';
    return method.toUpperCase();
  }

  private getRequestPath(req: TenantAwareRequest): string {
    const rawUrl =
      typeof req.raw === 'object' && req.raw
        ? ('originalUrl' in req.raw && typeof req.raw.originalUrl === 'string'
            ? req.raw.originalUrl
            : 'url' in req.raw && typeof req.raw.url === 'string'
              ? req.raw.url
              : undefined)
        : undefined;
    const url = req.originalUrl ?? req.url ?? rawUrl ?? '/';
    const normalized = url.startsWith('http://') || url.startsWith('https://')
      ? this.safeParseUrl(url)
      : url;

    const pathname = normalized.split('?')[0];
    return pathname.startsWith('/') ? pathname : `/${pathname}`;
  }

  private safeParseUrl(value: string): string {
    try {
      const parsed = new URL(value);
      return parsed.pathname || '/';
    } catch {
      return '/';
    }
  }

  private mergeHeaders(req: TenantAwareRequest): HeadersRecord {
    return {
      ...(req.headers ?? {}),
      ...((req.raw && typeof req.raw === 'object' && 'headers' in req.raw
        ? (req.raw as { headers?: HeadersRecord }).headers
        : undefined) ?? {}),
    };
  }

  private getTenantIdFromHeader(req: TenantAwareRequest): string | null {
    const headers = this.mergeHeaders(req);
    const value = headers['x-tenant-id'] ?? headers['X-Tenant-ID'];
    if (Array.isArray(value)) {
      return this.normalizeIdentifier(value[0]);
    }
    return this.normalizeIdentifier(value as string | undefined);
  }

  private getTenantIdFromCookie(req: TenantAwareRequest): string | null {
    if (req.cookies?.tenant_id) {
      return this.normalizeIdentifier(req.cookies.tenant_id);
    }

    const headers = this.mergeHeaders(req);
    const cookieHeader = headers.cookie ?? headers.Cookie;

    const rawCookie = Array.isArray(cookieHeader)
      ? cookieHeader.join(';')
      : cookieHeader;

    if (typeof rawCookie !== 'string') {
      return null;
    }

    for (const cookiePart of rawCookie.split(';')) {
      const [name, value] = cookiePart.split('=').map((part) => part?.trim());
      if (name === 'tenant_id' && value) {
        return this.normalizeIdentifier(decodeURIComponent(value));
      }
    }

    return null;
  }

  private async resolveTenant(identifier: string): Promise<Tenant | null> {
    const looksUuid = this.looksLikeUuid(identifier);

    if (looksUuid) {
      try {
        return await this.tenantsService.findById(identifier);
      } catch (error) {
        this.logger.debug(
          `Tenant lookup by ID failed for ${identifier}: ${(error as Error).message}`,
        );
        return null;
      }
    }

    try {
      return (await this.tenantsService.findByCode(identifier)) ?? null;
    } catch (error) {
      this.logger.debug(
        `Tenant lookup by code failed for ${identifier}: ${(error as Error).message}`,
      );
      return null;
    }
  }

  private attachTenant(req: TenantAwareRequest, tenant: Tenant | null): void {
    const tenantId = tenant?.id ?? null;

    req.tenant = tenant;
    req.tenantId = tenantId;

    if (req.raw && typeof req.raw === 'object') {
      Object.assign(req.raw, { tenant, tenantId });
      const rawUser = (req.raw as { user?: TenantCarrier | null }).user;
      if (rawUser && typeof rawUser === 'object') {
        Object.assign(rawUser, { tenant, tenantId });
      }
    }

    if (!req.user || typeof req.user !== 'object') {
      req.user = { tenant, tenantId };
    } else {
      Object.assign(req.user, { tenant, tenantId });
    }
  }

  private normalizeIdentifier(value?: string): string | null {
    if (!value || typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private looksLikeUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }
}

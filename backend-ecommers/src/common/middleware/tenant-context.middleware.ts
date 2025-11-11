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
  tenantCode?: string | null;
}

interface TenantJwtPayload extends TenantCarrier {
  tenantCode?: string | null;
  [key: string]: unknown;
}

type HeadersRecord = Record<string, string | string[] | undefined>;

type FastifyLikeRequest = {
  headers?: HeadersRecord;
  cookies?: Record<string, string>;
  originalUrl?: string;
  url?: string;
  method?: string;
  raw?:
    | (TenantCarrier &
        Record<string, unknown> & {
          headers?: HeadersRecord;
          cookies?: Record<string, string>;
          originalUrl?: string;
          url?: string;
          method?: string;
          user?: TenantCarrier & Record<string, unknown>;
        })
    | null;
  user?: (TenantCarrier & Record<string, unknown>) | null;
};

export type TenantAwareRequest = Partial<Request> &
  FastifyLikeRequest &
  TenantCarrier;

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
      this.logger.debug(
        `${method} ${path} | public route, skipping tenant context`,
      );
      return next();
    }

    let identifierSource: 'header' | 'cookie' | 'jwt' | 'none' = 'none';
    let tenantIdentifier = this.getTenantIdFromHeader(req);
    if (tenantIdentifier) {
      identifierSource = 'header';
    } else {
      tenantIdentifier = this.getTenantIdFromCookie(req);
      if (tenantIdentifier) {
        identifierSource = 'cookie';
      }
    }

    const jwtTenantInfo = !tenantIdentifier
      ? this.getTenantIdentifierFromJwt(req)
      : null;
    if (!tenantIdentifier && jwtTenantInfo) {
      tenantIdentifier = jwtTenantInfo.identifier;
      identifierSource = 'jwt';
    }

    this.logger.debug(
      `${method} ${path} | tenant identifier [${identifierSource}] => ${
        tenantIdentifier ?? 'none'
      }`,
    );

    if (!tenantIdentifier) {
      this.attachTenant(req, null);
      return next(new BadRequestException('Tenant context tidak ditemukan'));
    }

    try {
      let tenant: Tenant | null =
        jwtTenantInfo?.tenant && this.isTenantEntity(jwtTenantInfo.tenant)
          ? this.tenantMatchesIdentifier(jwtTenantInfo.tenant, tenantIdentifier)
            ? jwtTenantInfo.tenant
            : null
          : null;

      if (!tenant) {
        tenant = await this.resolveTenant(tenantIdentifier);
      }

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
        ? 'originalUrl' in req.raw && typeof req.raw.originalUrl === 'string'
          ? req.raw.originalUrl
          : 'url' in req.raw && typeof req.raw.url === 'string'
            ? req.raw.url
            : undefined
        : undefined;
    const url = req.originalUrl ?? req.url ?? rawUrl ?? '/';
    const normalized =
      url.startsWith('http://') || url.startsWith('https://')
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

  private getCookies(req: TenantAwareRequest): Record<string, string> {
    const result: Record<string, string> = {};

    const assignCookies = (source: unknown): void => {
      if (!source || typeof source !== 'object') {
        return;
      }

      for (const [key, value] of Object.entries(
        source as Record<string, unknown>,
      )) {
        if (typeof value === 'string') {
          result[key] = value;
        }
      }
    };

    assignCookies(req.cookies ?? null);

    if (req.raw && typeof req.raw === 'object' && 'cookies' in req.raw) {
      assignCookies((req.raw as { cookies?: unknown }).cookies);
    }

    return result;
  }

  private getTenantIdFromHeader(req: TenantAwareRequest): string | null {
    const headers = this.mergeHeaders(req);
    const value = headers['x-tenant-id'] ?? headers['X-Tenant-ID'];
    if (Array.isArray(value)) {
      return this.normalizeIdentifier(value[0]);
    }
    return this.normalizeIdentifier(value);
  }

  private getTenantIdFromCookie(req: TenantAwareRequest): string | null {
    const cookies = this.getCookies(req);
    const directCookie = this.normalizeIdentifier(cookies['tenant_id']);
    if (directCookie) {
      return directCookie;
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

  private getTenantIdentifierFromJwt(
    req: TenantAwareRequest,
  ): { identifier: string; tenant: Tenant | null } | null {
    const payload = this.getJwtPayload(req);
    if (!payload) {
      return null;
    }

    const tenant = this.extractTenantFromPayload(payload);
    const identifier =
      this.normalizeIdentifier(this.extractString(payload, 'tenantId')) ??
      this.normalizeIdentifier(this.extractString(payload, 'tenant_id')) ??
      this.normalizeIdentifier(this.extractString(payload, 'tenantCode')) ??
      this.normalizeIdentifier(this.extractString(payload, 'tenant_code')) ??
      (tenant ? this.normalizeIdentifier(tenant.id) : null) ??
      (tenant ? this.normalizeIdentifier(tenant.code) : null);

    if (!identifier) {
      return null;
    }

    return {
      identifier,
      tenant,
    };
  }

  private async resolveTenant(identifier: string): Promise<Tenant | null> {
    const looksUuid = this.looksLikeUuid(identifier);

    if (looksUuid) {
      try {
        const tenantResult: unknown =
          await this.tenantsService.findById(identifier);
        if (this.isTenantEntity(tenantResult)) {
          return tenantResult;
        }
        this.logger.debug(
          `Tenant lookup by ID returned invalid shape for ${identifier}`,
        );
        return null;
      } catch (error) {
        this.logger.debug(
          `Tenant lookup by ID failed for ${identifier}: ${(error as Error).message}`,
        );
        return null;
      }
    }

    try {
      const tenantResult: unknown =
        await this.tenantsService.findByCode(identifier);
      if (this.isTenantEntity(tenantResult)) {
        return tenantResult;
      }
      if (tenantResult) {
        this.logger.debug(
          `Tenant lookup by code returned invalid shape for ${identifier}`,
        );
      }
      return null;
    } catch (error) {
      this.logger.debug(
        `Tenant lookup by code failed for ${identifier}: ${(error as Error).message}`,
      );
      return null;
    }
  }

  private attachTenant(req: TenantAwareRequest, tenant: Tenant | null): void {
    const tenantId = tenant?.id ?? null;
    const tenantCode = tenant?.code ?? null;

    req.tenant = tenant;
    req.tenantId = tenantId;
    req.tenantCode = tenantCode;

    if (req.raw && typeof req.raw === 'object') {
      Object.assign(req.raw, { tenant, tenantId, tenantCode });
      const rawUser = (req.raw as { user?: TenantCarrier | null }).user;
      if (rawUser && typeof rawUser === 'object') {
        Object.assign(rawUser, { tenant, tenantId, tenantCode });
      }
    }

    if (!req.user || typeof req.user !== 'object') {
      req.user = { tenant, tenantId, tenantCode };
    } else {
      Object.assign(req.user, { tenant, tenantId, tenantCode });
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

  private getJwtPayload(req: TenantAwareRequest): TenantJwtPayload | null {
    const candidates: unknown[] = [];

    if (req.user && typeof req.user === 'object') {
      candidates.push(req.user);
    }

    if (req.raw && typeof req.raw === 'object' && 'user' in req.raw) {
      const rawUser = (req.raw as { user?: unknown }).user;
      if (rawUser && typeof rawUser === 'object') {
        candidates.push(rawUser);
      }
    }

    for (const candidate of candidates) {
      if (this.isJwtPayloadCandidate(candidate)) {
        return candidate;
      }
    }

    return null;
  }

  private extractString(source: TenantJwtPayload, key: string): string | null {
    const value = source[key];
    return typeof value === 'string' ? value : null;
  }

  private extractTenantFromPayload(payload: TenantJwtPayload): Tenant | null {
    const candidate = payload.tenant;
    if (this.isTenantEntity(candidate)) {
      return candidate;
    }
    return null;
  }

  private isTenantEntity(candidate: unknown): candidate is Tenant {
    return (
      !!candidate &&
      typeof candidate === 'object' &&
      'id' in candidate &&
      typeof (candidate as { id?: unknown }).id === 'string' &&
      'code' in candidate &&
      typeof (candidate as { code?: unknown }).code === 'string'
    );
  }

  private isJwtPayloadCandidate(
    candidate: unknown,
  ): candidate is TenantJwtPayload {
    return !!candidate && typeof candidate === 'object';
  }

  private tenantMatchesIdentifier(tenant: Tenant, identifier: string): boolean {
    const normalizedId = this.normalizeIdentifier(tenant.id);
    const normalizedCode = this.normalizeIdentifier(tenant.code);
    return normalizedId === identifier || normalizedCode === identifier;
  }
}

import {
  Injectable,
  NestMiddleware,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantsService } from '@/modules/tenants/tenants.service';

type TenantAwareRequest = Request & {
  tenantSource?: string | null;
  tenantHostname?: string | null;
  tenantSubdomain?: string | null;
};

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantContextMiddleware.name);
  private readonly debugEnabled =
    process.env.DEBUG_TENANT_CONTEXT === 'true' ||
    process.env.APP_DEBUG === 'true' ||
    process.env.NODE_ENV !== 'production';

  constructor(private readonly tenantsService: TenantsService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    try {
      const request = req as TenantAwareRequest;
      let tenantId: string | undefined;
      let tenantSource: string | undefined;

      const hostname = req.hostname ?? null;
      const subdomain =
        hostname && hostname.includes('.') ? hostname.split('.')[0] : null;

      request.tenantHostname = hostname;
      request.tenantSubdomain = subdomain;

      if (this.debugEnabled) {
        this.logger.debug(
          `TenantContext: incoming request hostname='${hostname ?? '-'}' subdomain='${
            subdomain ?? '-'
          }'`,
        );
      }

      // 1️⃣ Coba ambil dari Header
      tenantId = req.headers['x-tenant-id'] as string | undefined;
      if (tenantId) {
        tenantSource = 'header:x-tenant-id';
      }

      // 2️⃣ Jika tidak ada, ambil dari Cookie
      if (!tenantId && req.headers.cookie) {
        const match = req.headers.cookie.match(/tenant_id=([^;]+)/);
        if (match) {
          tenantId = decodeURIComponent(match[1]);
          tenantSource = 'cookie:tenant_id';
        }
      }

      // 3️⃣ Jika tidak ada, deteksi dari Subdomain (contoh: salwa.backend-ecommers.com)
      if (!tenantId && hostname && hostname.includes('.')) {
        const subdomain = hostname.split('.')[0];
        const tenant = await this.tenantsService.findByCode(subdomain);
        if (tenant) {
          tenantId = tenant.id;
          tenantSource = `subdomain:${subdomain}`;
        }
      }

      // 4️⃣ Fallback default tenant untuk debugging (misalnya tenant salwa)
      if (!tenantId) {
        const fallbackTenant = await this.tenantsService.findByCode('salwa');
        if (fallbackTenant) {
          tenantId = fallbackTenant.id;
          tenantSource = `fallback:${fallbackTenant.code}`;
          this.logger.warn(
            `⚠️ TenantContext: menggunakan default tenant '${fallbackTenant.code}' untuk debug`,
          );
        }
      }

      // 5️⃣ Kalau tetap tidak ditemukan
      if (!tenantId) {
        throw new BadRequestException('Tenant context tidak ditemukan');
      }

      // 6️⃣ Validasi tenant dari DB
      const tenant = await this.tenantsService.findById(tenantId);
      if (!tenant) {
        throw new BadRequestException(
          'Tenant tidak valid atau tidak ditemukan',
        );
      }

      // 7️⃣ Simpan ke request agar bisa diakses di controller/service
      (req as any).tenant = tenant;
      request.tenantId = tenant.id;
      request.tenantSource = tenantSource ?? null;

      if (this.debugEnabled) {
        this.logger.debug(
          `TenantContext resolved tenantId='${tenant.id}' source='${
            tenantSource ?? 'unknown'
          }' hostname='${hostname ?? '-'}' subdomain='${subdomain ?? '-'}'`,
        );
      }

      next();
    } catch (err) {
      this.logger.error(`TenantContext error: ${(err as Error).message}`);
      throw err;
    }
  }
}

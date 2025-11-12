import {
  Injectable,
  NestMiddleware,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantsService } from '@/modules/tenants/tenants.service';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantContextMiddleware.name);

  constructor(private readonly tenantsService: TenantsService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    try {
      let tenantId: string | undefined;

      // 1️⃣ Coba ambil dari Header
      tenantId = req.headers['x-tenant-id'] as string | undefined;

      // 2️⃣ Jika tidak ada, ambil dari Cookie
      if (!tenantId && req.headers.cookie) {
        const match = req.headers.cookie.match(/tenant_id=([^;]+)/);
        if (match) tenantId = decodeURIComponent(match[1]);
      }

      // 3️⃣ Jika tidak ada, deteksi dari Subdomain (contoh: salwa.backend-ecommers.com)
      if (!tenantId && req.hostname.includes('.')) {
        const subdomain = req.hostname.split('.')[0];
        const tenant = await this.tenantsService.findByCode(subdomain);
        if (tenant) tenantId = tenant.id;
      }

      // 4️⃣ Fallback default tenant untuk debugging (misalnya tenant salwa)
      if (!tenantId) {
        const fallbackTenant = await this.tenantsService.findByCode('salwa');
        if (fallbackTenant) {
          tenantId = fallbackTenant.id;
          this.logger.warn(`⚠️ Default tenant digunakan: ${fallbackTenant.code}`);
        }
      }

      // 5️⃣ Kalau tetap tidak ditemukan
      if (!tenantId) {
        throw new BadRequestException('Tenant context tidak ditemukan');
      }

      // 6️⃣ Validasi tenant dari DB
      const tenant = await this.tenantsService.findById(tenantId);
      if (!tenant) {
        throw new BadRequestException('Tenant tidak valid atau tidak ditemukan');
      }

      // 7️⃣ Simpan ke request agar bisa diakses di controller/service
      (req as any).tenant = tenant;
      next();
    } catch (err) {
      this.logger.error(`TenantContext error: ${(err as Error).message}`);
      throw err;
    }
  }
}

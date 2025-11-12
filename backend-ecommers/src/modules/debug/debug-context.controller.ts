import {
  Controller,
  Get,
  Req,
  Res,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { Public } from '@/common/decorators/public.decorator';

@Controller('debug')
export class DebugContextController {
  private readonly logger = new Logger(DebugContextController.name);

  @Public() // ✅ bisa diakses tanpa login (tapi menampilkan info terbatas)
  @Get('context')
  async getContext(@Req() req: Request, @Res() res: Response) {
    try {
      const tenant = (req as any).tenant || null;
      const user = (req as any).user || null;

      const hostname = req.hostname || null;
      const subdomain =
        hostname && hostname.includes('.') ? hostname.split('.')[0] : null;

      // Deteksi sumber tenant
      let tenantSource = 'unknown';
      if (req.headers['x-tenant-id']) tenantSource = 'header';
      else if (req.headers.cookie?.includes('tenant_id')) tenantSource = 'cookie';
      else if (subdomain && subdomain !== 'localhost') tenantSource = 'subdomain';
      else if (tenant && tenant.code === 'salwa') tenantSource = 'fallback';

      const response = {
        message: 'Debug context aktif',
        tenant: {
          source: tenantSource,
          id: tenant?.id ?? null,
          data: tenant
            ? {
                code: tenant.code,
                name: tenant.name,
              }
            : null,
          hostname,
          subdomain,
        },
        user: user
          ? {
              id: user.id,
              email: user.email,
              role: user.role,
            }
          : null,
        request: {
          method: req.method,
          path: req.path,
          headers: Object.keys(req.headers),
        },
      };

      this.logger.debug(`[DebugContext] Tenant source: ${tenantSource}`);
      return res.status(200).json(response);
    } catch (err) {
      this.logger.error(`DebugContext error: ${err.message}`);
      return res.status(500).json({
        message: 'Internal Server Error',
        error: err.message,
      });
    }
  }

  // ✅ Versi dengan proteksi JWT untuk melihat payload lengkap user
  @UseGuards(JwtAuthGuard)
  @Get('auth')
  async getAuthContext(@Req() req: Request, @Res() res: Response) {
    const user = (req as any).user || null;
    return res.status(200).json({
      message: 'Debug Auth aktif',
      user,
    });
  }
}

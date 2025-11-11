import { Controller, Get, Req } from '@nestjs/common';

import type { TenantAwareRequest } from '@/common/middleware/tenant-context.middleware';

@Controller('debug')
export class DebugController {
  @Get('tenant')
  getTenant(@Req() req: TenantAwareRequest) {
    return {
      message: 'Tenant context aktif',
      source: req.tenantSource ?? 'unknown',
      tenantId: req.tenantId ?? null,
      tenant: req.tenant ?? null,
    };
  }
}

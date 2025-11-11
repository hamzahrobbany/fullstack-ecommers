import { Controller, Get, Req } from '@nestjs/common';

import type { TenantAwareRequest } from '@/common/middleware/tenant-context.middleware';

@Controller('debug')
export class DebugController {
  @Get('tenant')
  getTenant(@Req() req: TenantAwareRequest) {
    return {
      message: 'TenantContextMiddleware test',
      tenantId: req.tenantId ?? null,
      tenantCode: req.tenantCode ?? null,
      tenant: req.tenant ?? null,
    };
  }
}

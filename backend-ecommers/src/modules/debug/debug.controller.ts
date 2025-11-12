import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';

type TenantDebugRequest = Request & {
  tenantSource?: string;
};

@Controller('debug')
export class DebugController {
  @Get('tenant')
  getTenant(@Req() req: TenantDebugRequest) {
    return {
      message: 'Tenant context aktif',
      source: req.tenantSource ?? 'unknown',
      tenantId: req.tenantId ?? null,
      tenant: req.tenant ?? null,
    };
  }
}

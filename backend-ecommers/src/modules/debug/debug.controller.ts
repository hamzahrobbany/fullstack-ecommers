import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';

@Controller('debug')
export class DebugController {
  @Get('tenant')
  getTenant(@Req() req: Request) {
    return {
      message: 'TenantContextMiddleware test',
      tenantId: req.tenantId ?? null,
      tenant: req.tenant || null,
    };
  }
}

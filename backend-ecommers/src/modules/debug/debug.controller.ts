import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';

type DebugRequest = Request & {
  tenantSource?: string | null;
  tenantHostname?: string | null;
  tenantSubdomain?: string | null;
  debugJwtPayload?: unknown;
};

@Controller('debug')
export class DebugController {
  @Get('tenant')
  getTenant(@Req() req: DebugRequest) {
    return {
      message: 'Tenant context aktif',
      source: req.tenantSource ?? 'unknown',
      tenantId: req.tenantId ?? null,
      tenant: req.tenant ?? null,
    };
  }

  @Get('context')
  getContext(@Req() req: DebugRequest) {
    return {
      message: 'Debug context aktif',
      tenant: {
        source: req.tenantSource ?? 'unknown',
        id: req.tenantId ?? null,
        data: req.tenant ?? null,
        hostname: req.tenantHostname ?? req.hostname ?? null,
        subdomain: req.tenantSubdomain ?? null,
      },
      user: req.debugJwtPayload ?? req.user ?? null,
    };
  }
}

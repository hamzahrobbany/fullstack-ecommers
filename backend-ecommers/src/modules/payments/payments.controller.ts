import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

import { PaymentsService } from './payments.service';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';

type TenantAwareRequest = Request & { tenantId?: string | null };

@ApiTags('Payments')
@ApiBearerAuth()
@Roles('OWNER', 'ADMIN')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  findAll(@Req() req: TenantAwareRequest) {
    const tenantId = this.extractTenantId(req);
    return this.paymentsService.findAll(tenantId);
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: TenantAwareRequest,
  ) {
    const tenantId = this.extractTenantId(req);
    return this.paymentsService.findOne(id, tenantId);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdatePaymentStatusDto,
    @Req() req: TenantAwareRequest,
  ) {
    const tenantId = this.extractTenantId(req);
    return this.paymentsService.updateStatus(id, tenantId, dto.status, {
      transactionId: dto.transactionId,
    });
  }

  private extractTenantId(req: TenantAwareRequest): string {
    const tenantId = req.tenantId ?? undefined;
    if (!tenantId) {
      throw new BadRequestException('Tenant context tidak ditemukan.');
    }
    return tenantId;
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentTenant } from '@/common/decorators/current-tenant.decorator';

import { PaymentsService } from './payments.service';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@Roles('OWNER', 'ADMIN')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  findAll(@CurrentTenant() tenantId: string) {
    return this.paymentsService.findAllByTenant(tenantId);
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.paymentsService.findOneByTenant(id, tenantId);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdatePaymentStatusDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.paymentsService.updateStatus(id, tenantId, dto.status, {
      transactionId: dto.transactionId,
    });
  }
}

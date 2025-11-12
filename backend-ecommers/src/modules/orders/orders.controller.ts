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

import { OrdersService } from './orders.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

type TenantAwareRequest = Request & { tenantId?: string | null };

@ApiTags('Orders')
@ApiBearerAuth()
@Roles('OWNER', 'ADMIN')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(@Req() req: TenantAwareRequest) {
    const tenantId = this.extractTenantId(req);
    return this.ordersService.findAll(tenantId);
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: TenantAwareRequest,
  ) {
    const tenantId = this.extractTenantId(req);
    return this.ordersService.findOne(id, tenantId);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Req() req: TenantAwareRequest,
  ) {
    const tenantId = this.extractTenantId(req);
    return this.ordersService.updateStatus(id, tenantId, dto.status);
  }

  private extractTenantId(req: TenantAwareRequest): string {
    const tenantId = req.tenantId ?? undefined;
    if (!tenantId) {
      throw new BadRequestException('Tenant context tidak ditemukan.');
    }
    return tenantId;
  }
}

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

import { OrdersService } from './orders.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@ApiTags('Orders')
@ApiBearerAuth()
@Roles('OWNER', 'ADMIN')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(@CurrentTenant() tenantId: string) {
    return this.ordersService.findAllByTenant(tenantId);
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.ordersService.findOneByTenant(id, tenantId);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.ordersService.updateStatus(id, tenantId, dto.status);
  }
}

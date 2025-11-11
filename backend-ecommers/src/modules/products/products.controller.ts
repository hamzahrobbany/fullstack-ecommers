import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
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

import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

interface TenantAwareRequest extends Request {
  tenantId?: string | null;
}

@ApiTags('Products')
@ApiBearerAuth()
@Roles('OWNER', 'ADMIN')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Req() req: TenantAwareRequest) {
    const tenantId = this.extractTenantId(req);
    return this.productsService.findAll(tenantId);
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: TenantAwareRequest,
  ) {
    const tenantId = this.extractTenantId(req);
    return this.productsService.findOne(id, tenantId);
  }

  @Post()
  create(@Body() dto: CreateProductDto, @Req() req: TenantAwareRequest) {
    const tenantId = this.extractTenantId(req);
    return this.productsService.create(tenantId, dto);
  }

  @Put(':id')
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateProductDto,
    @Req() req: TenantAwareRequest,
  ) {
    const tenantId = this.extractTenantId(req);
    return this.productsService.update(id, tenantId, dto);
  }

  @Delete(':id')
  delete(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: TenantAwareRequest,
  ) {
    const tenantId = this.extractTenantId(req);
    return this.productsService.delete(id, tenantId);
  }

  private extractTenantId(req: TenantAwareRequest): string {
    const tenantId = req.tenantId ?? undefined;
    if (!tenantId) {
      throw new BadRequestException('Tenant context tidak ditemukan.');
    }
    return tenantId;
  }
}

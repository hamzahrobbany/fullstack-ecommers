import { Module } from '@nestjs/common';

import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { TenantsModule } from '@/modules/tenants/tenants.module';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

@Module({
  imports: [PrismaModule, TenantsModule],
  controllers: [ProductsController],
  providers: [ProductsService, TenantGuard, RolesGuard],
})
export class ProductsModule {}

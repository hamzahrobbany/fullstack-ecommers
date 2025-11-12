import { Module } from '@nestjs/common';

import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { TenantsModule } from '@/modules/tenants/tenants.module';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

@Module({
  imports: [PrismaModule, TenantsModule],
  controllers: [OrdersController],
  providers: [OrdersService, TenantGuard, RolesGuard],
  exports: [OrdersService],
})
export class OrdersModule {}

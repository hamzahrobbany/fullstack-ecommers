import { Module } from '@nestjs/common';

import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { TenantsModule } from '@/modules/tenants/tenants.module';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

@Module({
  imports: [PrismaModule, TenantsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, TenantGuard, RolesGuard],
})
export class PaymentsModule {}

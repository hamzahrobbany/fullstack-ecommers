import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { TenantContextMiddleware } from '@/common/middleware/tenant-context.middleware';
import { DebugController } from '@/modules/debug/debug.controller';
import { AuthModule } from '@/modules/auth/auth.module';
import { UsersModule } from '@/modules/users/users.module';
import { TenantsModule } from '@/modules/tenants/tenants.module';
import { ProductsModule } from '@/modules/products/products.module';
import { OrdersModule } from '@/modules/orders/orders.module';
import { PaymentsModule } from '@/modules/payments/payments.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    TenantsModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
  ],
  controllers: [AppController, DebugController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantContextMiddleware)
      .exclude('/api/auth/register', '/api/auth/login', '/api/docs')
      .forRoutes('*');
  }
}

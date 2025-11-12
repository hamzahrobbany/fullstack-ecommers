import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { TenantContextMiddleware } from '@/common/middleware/tenant-context.middleware';
import { AuthModule } from '@/modules/auth/auth.module';
import { DebugController } from '@/modules/debug/debug.controller';
import { OrdersModule } from '@/modules/orders/orders.module';
import { PaymentsModule } from '@/modules/payments/payments.module';
import { ProductsModule } from '@/modules/products/products.module';
import { TenantsModule } from '@/modules/tenants/tenants.module';
import { UsersModule } from '@/modules/users/users.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    TenantsModule,
    AuthModule,
    UsersModule,
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
      .exclude(
        '/api/auth/register',
        '/api/auth/login',
        '/api/docs',
        '/api',
        '/',
      )
      .forRoutes('*');
  }
}

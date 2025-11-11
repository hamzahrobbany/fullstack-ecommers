import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { TenantContextMiddleware } from '@/common/middleware/tenant-context.middleware';
import { DebugController } from '@/modules/debug/debug.controller';
import { AuthModule } from '@/modules/auth/auth.module';
import { UsersModule } from '@/modules/users/users.module';
import { TenantsModule } from '@/modules/tenants/tenants.module';
import { ProductsModule } from '@/modules/products/products.module';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    TenantsModule,
    ProductsModule,
  ],
  controllers: [DebugController],
  providers: [TenantContextMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}

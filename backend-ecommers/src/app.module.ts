import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// === Core Middleware ===
import { TenantContextMiddleware } from './common/middleware/tenant-context.middleware';

// === Core Modules ===
import { PrismaModule } from './prisma/prisma.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';

// === Optional/Utility ===
import { DebugController } from './modules/debug/debug.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    TenantsModule,
    AuthModule,
    ProductsModule,
  ],
  controllers: [DebugController],
  providers: [TenantContextMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantContextMiddleware)
      .exclude(
        { path: 'api/docs', method: RequestMethod.ALL },
        { path: 'api/docs/*', method: RequestMethod.ALL },
        { path: 'api-json', method: RequestMethod.ALL },
        { path: 'swagger-ui', method: RequestMethod.ALL },
        { path: 'swagger-ui/*', method: RequestMethod.ALL },
        { path: 'favicon.ico', method: RequestMethod.ALL },
      )
      .forRoutes('*');
  }
}

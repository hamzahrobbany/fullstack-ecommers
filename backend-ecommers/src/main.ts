import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import {
  ExpressAdapter,
  NestExpressApplication,
} from '@nestjs/platform-express';
import { Logger } from '@nestjs/common';
import {
  SwaggerModule,
  DocumentBuilder,
  SwaggerCustomOptions,
} from '@nestjs/swagger';

// 🧩 Middleware
import { TenantContextMiddleware } from './common/middleware/tenant-context.middleware';

// 🌐 Fastify plugins
import fastifyHelmet from '@fastify/helmet';
import fastifyCompress from '@fastify/compress';
import fastifyCors from '@fastify/cors';

// 🌐 Express middlewares
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';

// 📘 Swagger Plugins
import { swaggerAuthPlugin } from './common/swagger/swagger-auth.plugin';

let cachedApp: NestFastifyApplication | NestExpressApplication;

export async function bootstrapServer(): Promise<
  NestFastifyApplication | NestExpressApplication
> {
  if (cachedApp) return cachedApp;

  const isServerless =
    process.env.VERCEL === '1' ||
    process.env.VERCEL === 'true' ||
    process.env.SERVERLESS === 'true';

  // ======================================================
  // ☁️ EXPRESS MODE (Vercel / Serverless)
  // ======================================================
  if (isServerless) {
    const expressApp = await NestFactory.create<NestExpressApplication>(
      AppModule,
      new ExpressAdapter(),
    );

    const nativeExpress = expressApp.getHttpAdapter().getInstance();

    nativeExpress.use(cors({ origin: true, credentials: true }));
    nativeExpress.use(compression());
    nativeExpress.use(
      helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
      }),
    );

    expressApp.setGlobalPrefix('api');

    // 🧩 Apply TenantContextMiddleware but exclude public routes
    expressApp.use((req, res, next) => {
      const url = req.url.toLowerCase();

      const isPublic =
        url.includes('/api/docs') ||
        url.includes('/swagger-ui') ||
        url.includes('/api-json') ||
        url.startsWith('/favicon') ||
        url.startsWith('/auth/login') ||
        url.startsWith('/api/auth/login') ||
        url.startsWith('/auth/register') ||
        url.startsWith('/api/auth/register') ||
        url.startsWith('/tenants');

      if (isPublic) return next();

      const tenantContext = expressApp.get(TenantContextMiddleware);
      (tenantContext as any).use(req as any, res, next);
    });

    // 📘 Swagger hanya aktif di development
    if (process.env.NODE_ENV !== 'production') {
      const builder = new DocumentBuilder()
        .setTitle('E-Commerce API')
        .setDescription('Dokumentasi REST API Backend E-Commerce')
        .setVersion('1.0')
        .addBearerAuth();

      const swaggerBuilder =
        typeof (builder as any).addApiHeader === 'function'
          ? (builder as any).addApiHeader({
              name: 'X-Tenant-ID',
              required: false,
              description:
                'Tenant UUID atau kode tenant aktif (opsional, bisa digantikan tenantCode di body)',
            })
          : builder;

      const config = swaggerBuilder.build();

      const document = SwaggerModule.createDocument(expressApp, config);

      const swaggerOptions: SwaggerCustomOptions = {
        swaggerOptions: {
          persistAuthorization: true,
          plugins: [swaggerAuthPlugin()],
          requestInterceptor: (req) => {
            try {
              const token = window?.localStorage?.getItem('swagger_token');
              const tenant = window?.localStorage?.getItem('swagger_tenant');
              req.headers = req.headers || {};
              if (token) req.headers.Authorization = `Bearer ${token}`;
              if (tenant) req.headers['X-Tenant-ID'] = tenant;
            } catch (e) {
              console.warn('[Swagger] Failed to attach headers:', e);
            }
            return req;
          },
        },
        customSiteTitle: 'E-Commerce API Docs',
      };

      SwaggerModule.setup('api/docs', expressApp, document, swaggerOptions);
      Logger.log('📘 Swagger Docs: http://localhost:3000/api/docs', 'Swagger');
    }

    await expressApp.init();
    cachedApp = expressApp;
    return expressApp;
  }

  // ======================================================
  // 🚀 FASTIFY MODE (Local Development)
  // ======================================================
  const fastifyApp = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  await fastifyApp.register(fastifyHelmet, {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  });
  await fastifyApp.register(fastifyCompress);
  await fastifyApp.register(fastifyCors, { origin: true, credentials: true });

  fastifyApp.setGlobalPrefix('api');

  // 🧩 TenantContextMiddleware (Fastify) — exclude public routes
  const tenantContext = fastifyApp.get(TenantContextMiddleware);
  fastifyApp.use((req, res, next) => {
    const url = req.url.toLowerCase();

    const isPublic =
      url.includes('/api/docs') ||
      url.includes('/swagger-ui') ||
      url.includes('/api-json') ||
      url.startsWith('/favicon') ||
      url.startsWith('/auth/login') ||
      url.startsWith('/api/auth/login') ||
      url.startsWith('/auth/register') ||
      url.startsWith('/api/auth/register') ||
      url.startsWith('/tenants');

    if (isPublic) return next();

    (tenantContext as any).use(req as any, res, next);
  });

  // 📘 Swagger
  if (process.env.NODE_ENV !== 'production') {
    const builder = new DocumentBuilder()
      .setTitle('E-Commerce API')
      .setDescription('Dokumentasi REST API Backend E-Commerce')
      .setVersion('1.0')
      .addBearerAuth();

    const swaggerBuilder =
      typeof (builder as any).addApiHeader === 'function'
        ? (builder as any).addApiHeader({
            name: 'X-Tenant-ID',
            required: false,
            description:
              'Tenant UUID atau kode tenant aktif (opsional, bisa digantikan tenantCode di body)',
          })
        : builder;

    const config = swaggerBuilder.build();

    const document = SwaggerModule.createDocument(fastifyApp, config);

    const swaggerOptions: SwaggerCustomOptions = {
      swaggerOptions: {
        persistAuthorization: true,
        plugins: [swaggerAuthPlugin()],
        requestInterceptor: (req) => {
          try {
            const token = window?.localStorage?.getItem('swagger_token');
            const tenant = window?.localStorage?.getItem('swagger_tenant');
            req.headers = req.headers || {};
            if (token) req.headers.Authorization = `Bearer ${token}`;
            if (tenant) req.headers['X-Tenant-ID'] = tenant;
          } catch (e) {
            console.warn('[Swagger] Failed to attach headers:', e);
          }
          return req;
        },
      },
      customSiteTitle: 'E-Commerce API Docs',
    };

    SwaggerModule.setup('api/docs', fastifyApp, document, swaggerOptions);
    Logger.log('📘 Swagger Docs: http://localhost:3000/api/docs', 'Swagger');
  }

  cachedApp = fastifyApp;
  return fastifyApp;
}

/**
 * 🧩 Local Development Entry Point (Fastify)
 */
if (process.env.NODE_ENV !== 'production') {
  const logger = new Logger('Bootstrap');

  bootstrapServer()
    .then(async (app) => {
      const fastifyApp = app as NestFastifyApplication;
      const instance = fastifyApp.getHttpAdapter().getInstance();

      await app.init();
      await instance.ready();
      await instance.listen({ port: 3000, host: '0.0.0.0' });

      logger.log('✅ Local server running at http://localhost:3000/api');
      logger.log('📘 Swagger Docs: http://localhost:3000/api/docs');
      console.log('\n🛣️  Registered Routes:\n');
      console.log(instance.printRoutes());
      console.log('---------------------------------------------');
    })
    .catch((err) => {
      console.error('❌ Failed to start local server:', err);
      process.exit(1);
    });
}

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
import { logRegisteredRoutes } from './utils/log-registered-routes';

// 🌐 Fastify plugins
import fastifyHelmet from '@fastify/helmet';
import fastifyCompress from '@fastify/compress';

// 🌐 Express middlewares
import helmet from 'helmet';
import compression from 'compression';

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

    expressApp.enableCors({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });

    const nativeExpress = expressApp.getHttpAdapter().getInstance();

    nativeExpress.use(compression());
    nativeExpress.use(
      helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
      }),
    );

    expressApp.setGlobalPrefix('api');

    // 🧩 Apply TenantContextMiddleware globally (public routes akan di-handle oleh middleware).
    const tenantMiddleware = expressApp.get(TenantContextMiddleware);
    expressApp.use(tenantMiddleware.use.bind(tenantMiddleware));

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
    logRegisteredRoutes(expressApp, 'ExpressRoutes');
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

  fastifyApp.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  fastifyApp.setGlobalPrefix('api');

  // 🧩 TenantContextMiddleware (Fastify) — diaplikasikan secara global.
  const fastifyTenantMiddleware = fastifyApp.get(TenantContextMiddleware);
  fastifyApp.use(fastifyTenantMiddleware.use.bind(fastifyTenantMiddleware));

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

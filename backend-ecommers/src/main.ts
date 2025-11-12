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

// 🧩 Middleware & Utils
import { logRegisteredRoutes } from './utils/log-registered-routes';
import { swaggerAuthPlugin } from './common/swagger/swagger-auth.plugin';

// 🌐 Fastify plugins
import fastifyHelmet from '@fastify/helmet';
import fastifyCompress from '@fastify/compress';

// 🌐 Express middlewares
import helmet from 'helmet';
import compression from 'compression';

let cachedApp: NestFastifyApplication | NestExpressApplication;

export async function bootstrapServer(): Promise<
  NestFastifyApplication | NestExpressApplication
> {
  if (cachedApp) return cachedApp;

  const isServerless =
    process.env.VERCEL === '1' ||
    process.env.VERCEL === 'true' ||
    process.env.SERVERLESS === 'true';

  const globalPrefix = 'api';

  // ======================================================
  // ☁️ EXPRESS MODE (Vercel / Serverless)
  // ======================================================
  if (isServerless) {
    const expressApp = await NestFactory.create<NestExpressApplication>(
      AppModule,
      new ExpressAdapter(),
    );

    expressApp.setGlobalPrefix(globalPrefix);

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

    // 📘 Swagger (aktif hanya di dev)
    if (process.env.NODE_ENV !== 'production') {
      const builder = new DocumentBuilder()
        .setTitle('E-Commerce API')
        .setDescription('Dokumentasi REST API Backend E-Commerce')
        .setVersion('1.0')
        .addBearerAuth(); // ✅ tidak lagi pakai addServer('/api')

      const config = builder.build();
      const document = SwaggerModule.createDocument(expressApp, config);

      const swaggerOptions: SwaggerCustomOptions = {
        swaggerOptions: {
          persistAuthorization: true,
          plugins: [swaggerAuthPlugin],
        },
        customSiteTitle: 'E-Commerce API Docs',
      };

      // ✅ gunakan globalPrefix otomatis di path Swagger
      const swaggerPath = `${globalPrefix}/docs`;
      SwaggerModule.setup(swaggerPath, expressApp, document, swaggerOptions);
      Logger.log(`📘 Swagger Docs: http://localhost:3000/${swaggerPath}`, 'Swagger');
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

  fastifyApp.setGlobalPrefix(globalPrefix);

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

  // 📘 Swagger (aktif hanya di dev)
  if (process.env.NODE_ENV !== 'production') {
    const builder = new DocumentBuilder()
      .setTitle('E-Commerce API')
      .setDescription('Dokumentasi REST API Backend E-Commerce')
      .setVersion('1.0')
      .addBearerAuth(); // ✅ hapus addServer('/api')

    const config = builder.build();
    const document = SwaggerModule.createDocument(fastifyApp, config);

    const swaggerOptions: SwaggerCustomOptions = {
      swaggerOptions: {
        persistAuthorization: true,
        plugins: [swaggerAuthPlugin],
      },
      customSiteTitle: 'E-Commerce API Docs',
    };

    // ✅ gunakan prefix otomatis
    const swaggerPath = `${globalPrefix}/docs`;
    SwaggerModule.setup(swaggerPath, fastifyApp, document, swaggerOptions);
    Logger.log(`📘 Swagger Docs: http://localhost:3000/${swaggerPath}`, 'Swagger');
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

import type { Request, Response } from 'express';
import express, { type Express } from 'express';
import compression from 'compression';
import helmet from 'helmet';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { swaggerAuthPlugin } from './common/swagger/swagger-auth.plugin';
import { logRegisteredRoutes } from './utils/log-registered-routes';

let cachedServer: Express | null = null;

async function bootstrap(): Promise<Express> {
  if (cachedServer) {
    return cachedServer;
  }

  const server = express();
  const adapter = new ExpressAdapter(server);

  const app = await NestFactory.create(AppModule, adapter, {
    logger: ['log', 'warn', 'error'],
  });

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.setGlobalPrefix('api');

  const nativeExpress = app.getHttpAdapter().getInstance() as Express;
  nativeExpress.use(compression());
  nativeExpress.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  const builder = new DocumentBuilder()
    .setTitle('E-Commerce API')
    .setDescription('Dokumentasi REST API Backend E-Commerce')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer('/api');

  const swaggerConfig = builder.build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      plugins: [swaggerAuthPlugin()],
      requestInterceptor: (req: Record<string, any>) => {
        try {
          const globalWindow = (globalThis as any)?.window;
          const token = globalWindow?.localStorage?.getItem('swagger_token');
          const tenant = globalWindow?.localStorage?.getItem('swagger_tenant');
          req.headers = req.headers || {};
          if (token) req.headers.Authorization = `Bearer ${token}`;
          if (tenant) req.headers['X-Tenant-ID'] = tenant;
        } catch (error) {
          Logger.warn(`Failed to enrich Swagger request headers: ${(error as Error).message}`);
        }
        return req;
      },
    },
    customSiteTitle: 'E-Commerce API Docs',
  });

  await app.init();

  logRegisteredRoutes(app, 'VercelRoutes');

  cachedServer = server;
  return server;
}

export default async function handler(req: Request, res: Response) {
  const server = await bootstrap();
  return server(req, res);
}

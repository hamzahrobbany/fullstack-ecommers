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

// Cache untuk cold start
let cachedServer: Express | null = null;

async function bootstrap(): Promise<Express> {
  if (cachedServer) return cachedServer;

  const server = express();

  // ✅ Middleware global (non-Nest)
  server.use(compression());
  server.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    logger: ['log', 'warn', 'error'],
  });

  // ✅ CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // ❌ Tidak pakai prefix /api
  // app.setGlobalPrefix('api');

  // ✅ Swagger Docs di /docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('E-Commerce API')
    .setDescription('Dokumentasi REST API Backend E-Commerce')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addServer('/')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      plugins: [swaggerAuthPlugin()],
      requestInterceptor: (req: Record<string, any>) => {
        try {
          if (typeof window !== 'undefined') {
            const token = window.localStorage?.getItem('swagger_token');
            const tenant = window.localStorage?.getItem('swagger_tenant');
            req.headers = req.headers || {};
            if (token) req.headers.Authorization = `Bearer ${token}`;
            if (tenant) req.headers['X-Tenant-ID'] = tenant;
          }
        } catch (error) {
          Logger.warn(`Failed to enrich Swagger headers: ${(error as Error).message}`);
        }
        return req;
      },
    },
    customSiteTitle: 'E-Commerce API Docs',
  });

  await app.init();

  // Log route terdaftar
  logRegisteredRoutes(app, 'VercelRoutes');

  cachedServer = server;
  return server;
}

// ✅ Handler default untuk Vercel
export default async function handler(req: Request, res: Response) {
  try {
    const server = await bootstrap();
    server(req, res);
  } catch (error) {
    Logger.error(`❌ Handler Error: ${(error as Error).message}`);
    res.status(500).send('Internal Server Error');
  }
}

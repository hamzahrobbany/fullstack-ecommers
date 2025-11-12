import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { type Express } from 'express';

const server: Express = express();

async function bootstrap(): Promise<Express> {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    logger: ['log', 'warn', 'error'],
  });

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  await app.init(); // ✅ Penting untuk Vercel
  return server;
}

const handler = bootstrap();

// ✅ Export default untuk Vercel entrypoint
export default handler;

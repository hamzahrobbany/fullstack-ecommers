import { Controller, Get } from '@nestjs/common';

@Controller() // jangan tambahkan 'api' karena sudah di-setGlobalPrefix('api') di main.ts
export class AppController {
  @Get('info')
  getInfo() {
    return {
      ok: true,
      name: 'Backend E-Commerce',
      framework: 'NestJS + Fastify',
      platform: process.env.VERCEL ? 'Vercel Serverless' : 'Local Development',
      time: new Date().toISOString(),
      node: process.version,
    };
  }

  @Get()
  getRoot() {
    return {
      ok: true,
      message: '🚀 Welcome to Backend E-Commerce API',
      docs: '/api/info',
      health: '/api/healthz',
      endpoints: [
        '/api/products',
        '/api/tenants',
        '/api/users',
        '/api/subscribe',
      ],
    };
  }

  @Get('healthz')
  getHealth() {
    return {
      status: 'ok',
      uptime: `${process.uptime().toFixed(2)}s`,
      timestamp: new Date().toISOString(),
    };
  }
}

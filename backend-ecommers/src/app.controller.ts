import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello() {
    return {
      message: '🚀 Backend E-Commers API is running successfully!',
      docs: '/api/docs',
      version: '1.0.0',
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

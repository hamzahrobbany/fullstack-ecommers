// vercel.ts (serverless entry point)
import { bootstrapServer } from './main';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * ✅ Vercel serverless entry point
 * Mem-bootstraps NestJS (Express adapter) hanya sekali,
 * lalu meneruskan semua request ke instance Express.
 */

let cachedApp: any = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Hindari re-init setiap request di Vercel
    if (!cachedApp) {
      cachedApp = await bootstrapServer();
    }

    const instance = cachedApp.getHttpAdapter().getInstance();

    // ✅ Panggil langsung handler Express
    return instance(req, res);
  } catch (error) {
    console.error('❌ Vercel function crashed:', error);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
}

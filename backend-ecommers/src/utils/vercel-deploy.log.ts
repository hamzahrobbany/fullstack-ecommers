import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';

const logDir = path.resolve(process.cwd(), '.vercel');
const logFile = path.join(logDir, 'deploy.log');

if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

function writeLog(line: string) {
  fs.appendFileSync(logFile, line + '\n', 'utf8');
}

export function logDeploy(message: string, meta: Record<string, any> = {}) {
  const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
  const line = `[${timestamp}] ${message}${
    Object.keys(meta).length ? ' | ' + JSON.stringify(meta) : ''
  }`;
  console.log(line);
  writeLog(line);
}

export function logVercelEnv() {
  const env = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: !!process.env.VERCEL,
    SERVERLESS: process.env.SERVERLESS,
    REGION: process.env.VERCEL_REGION ?? 'local',
  };
  logDeploy('🚀 Vercel environment detected', env);
  return env;
}

/**
 * Middleware sederhana untuk mencatat setiap request.
 * Pasang di Fastify atau Express sebelum routes.
 */
export function logRequest(req: any, res: any, next: () => void) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const line = `${format(new Date(), 'HH:mm:ss')} ${req.method} ${res.statusCode} ${req.url} (${duration}ms)`;
    writeLog(line);
  });
  next();
}

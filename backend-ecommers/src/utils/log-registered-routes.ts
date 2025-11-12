import type { INestApplication } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import type { Router } from 'express';

type ExpressLayer = {
  route?: {
    path: string;
    methods: Record<string, boolean>;
  };
  name: string;
  handle?: { stack?: ExpressLayer[] };
};

function formatPath(path: string, prefix: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!prefix) {
    return normalizedPath;
  }

  const prefixed = prefix.startsWith('/') ? prefix : `/${prefix}`;
  return normalizedPath.startsWith(prefixed)
    ? normalizedPath
    : `${prefixed}${normalizedPath === '/' ? '' : normalizedPath}`;
}

function collectExpressRoutes(router: Router | undefined, prefix: string): string[] {
  if (!router) {
    return [];
  }

  const routes: string[] = [];
  const stack = (router as unknown as { stack?: ExpressLayer[] }).stack ?? [];

  const visitLayer = (layer: ExpressLayer) => {
    if (layer.route) {
      const methods = Object.entries(layer.route.methods)
        .filter(([, enabled]) => enabled)
        .map(([method]) => method.toUpperCase())
        .join(',');

      const path = formatPath(layer.route.path ?? '/', prefix);
      routes.push(`${methods || 'ALL'} ${path}`);
      return;
    }

    if (layer.name === 'router' && layer.handle?.stack) {
      layer.handle.stack.forEach(visitLayer);
    }
  };

  stack.forEach(visitLayer);
  return routes;
}

export function logRegisteredRoutes(app: INestApplication, context = 'Routes'): void {
  const logger = new Logger(context);
  const httpAdapter = app.getHttpAdapter();
  const adapterType = httpAdapter.getType();
  const prefix = (app as any).getGlobalPrefix?.() ?? '';

  try {
    if (adapterType === 'express') {
      const instance = httpAdapter.getInstance();
      const routes = collectExpressRoutes(instance._router, prefix);

      if (routes.length === 0) {
        logger.warn('No HTTP routes registered.');
        return;
      }

      logger.log(`Registered ${routes.length} route(s):`);
      routes.forEach((route) => logger.log(route));
      return;
    }

    if (adapterType === 'fastify') {
      const instance = httpAdapter.getInstance();
      if (typeof instance.printRoutes === 'function') {
        const printed = instance.printRoutes({ commonPrefix: false });
        logger.log('Fastify routes:\n' + printed);
      } else {
        logger.warn('Fastify instance does not support printRoutes().');
      }
      return;
    }

    logger.warn(`Unsupported HTTP adapter type: ${adapterType}`);
  } catch (error) {
    logger.error(`Failed to log registered routes: ${(error as Error).message}`);
  }
}

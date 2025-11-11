// src/prisma/prisma.service.ts
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

type PrismaClientLike = {
  new (): {
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    $queryRaw<T = unknown>(query: TemplateStringsArray, ...values: any[]): Promise<T>;
    $use?(middleware: (...args: any[]) => Promise<any>): void;
    [key: string]: any;
  };
};

let PrismaClientBase: PrismaClientLike;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  PrismaClientBase = require('@prisma/client').PrismaClient as PrismaClientLike;
} catch {
  PrismaClientBase = class {
    async $connect() {}
    async $disconnect() {}
    async $queryRaw() {
      return null;
    }
  } as PrismaClientLike;
}

@Injectable()
export class PrismaService
  extends (PrismaClientBase as unknown as { new (): any })
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private keepAliveInterval?: NodeJS.Timeout;
  private reconnecting = false;

  async onModuleInit() {
    await this.connectWithRetry();
    this.registerSoftDeleteMiddleware(); // 🧩 aktifkan middleware soft delete
    this.startKeepAlive();
  }

  /**
   * 🔁 Mekanisme retry saat koneksi Neon gagal
   */
  private async connectWithRetry(retries = 5, delay = 3000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.$connect();
        this.logger.log('✅ Prisma connected to Neon PostgreSQL (pooler)');
        return;
      } catch (err) {
        this.logger.warn(`⚠️ Connection attempt ${attempt} failed: ${err}`);
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, delay));
        } else {
          this.logger.error('❌ Could not connect to Neon after retries');
          throw err;
        }
      }
    }
  }

  /**
   * 💓 Keep-alive query untuk jaga koneksi Neon tetap aktif
   */
  private startKeepAlive() {
    this.keepAliveInterval = setInterval(async () => {
      try {
        await this.$queryRaw`SELECT 1`;
      } catch (err) {
        if (!this.reconnecting) {
          this.reconnecting = true;
          this.logger.warn('⚠️ Lost connection, trying to reconnect...');
          try {
            await this.$disconnect();
            await this.connectWithRetry();
            this.logger.log('🔄 Prisma reconnected successfully.');
          } catch (reconnectErr) {
            this.logger.error('❌ Reconnection failed:', reconnectErr);
          } finally {
            this.reconnecting = false;
          }
        }
      }
    }, 30_000);
  }

  /**
   * 🧩 Middleware global Soft Delete
   * - Menyembunyikan data dengan deletedAt != null dari semua query
   * - Mengubah delete → update deletedAt
   */
  private registerSoftDeleteMiddleware() {
    if (!this.$use) return;

    const modelsWithSoftDelete = [
      'Tenant',
      'User',
      'Product',
      'Stock',
      'Order',
      'OrderItem',
      'Payment',
    ];

    this.$use(async (params, next) => {
      const model = params.model ?? '';

      if (modelsWithSoftDelete.includes(model)) {
        // Filter otomatis: abaikan data yang sudah soft deleted
        if (['findMany', 'findFirst'].includes(params.action)) {
          if (!params.args) params.args = {};
          if (!params.args.where) params.args.where = {};
          // jika belum di-override, tambahkan filter deletedAt: null
          if (params.args.where.deletedAt === undefined) {
            params.args.where.deletedAt = null;
          }
        }

        // Ganti delete jadi soft delete (update deletedAt)
        if (params.action === 'delete') {
          params.action = 'update';
          params.args['data'] = { deletedAt: new Date() };
        }

        // Ganti deleteMany jadi updateMany
        if (params.action === 'deleteMany') {
          params.action = 'updateMany';
          if (!params.args.data) params.args.data = {};
          params.args.data['deletedAt'] = new Date();
        }
      }

      return next(params);
    });

    this.logger.log('🧠 Soft Delete middleware aktif untuk semua model tenant-aware');
  }

  async onModuleDestroy() {
    if (this.keepAliveInterval) clearInterval(this.keepAliveInterval);
    await this.$disconnect();
    this.logger.log('🛑 Prisma disconnected cleanly.');
  }
}

// src/prisma/prisma.service.ts
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private keepAliveInterval?: NodeJS.Timeout;
  private reconnecting = false;

  async onModuleInit() {
    await this.connectWithRetry();
    this.startKeepAlive();
  }

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

  async onModuleDestroy() {
    if (this.keepAliveInterval) clearInterval(this.keepAliveInterval);
    await this.$disconnect();
    this.logger.log('🛑 Prisma disconnected cleanly.');
  }
}

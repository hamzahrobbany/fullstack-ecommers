import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

// ✅ Prisma Singleton untuk Vercel Serverless
const globalForPrisma = global as unknown as { prisma?: PrismaService };

export const prisma = globalForPrisma.prisma || new PrismaService();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

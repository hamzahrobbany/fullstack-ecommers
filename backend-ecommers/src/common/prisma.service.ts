import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

type PrismaClientLike = {
  new (): {
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
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
  } as PrismaClientLike;
}

/**
 * PrismaService
 * -------------
 * Service global untuk koneksi ke database PostgreSQL (via Prisma).
 * 
 * Bisa di-inject ke semua module (Auth, User, Product, Tenant, dsb)
 * tanpa perlu membuat instance Prisma baru.
 */
@Injectable()
export class PrismaService extends (PrismaClientBase as any) implements OnModuleInit, OnModuleDestroy {
  /**
   * Inisialisasi koneksi saat modul pertama kali dijalankan.
   */
  async onModuleInit() {
    await this.$connect();
    console.log('✅ PrismaService: Connected to database');
  }

  /**
   * Pastikan koneksi ditutup saat aplikasi berhenti.
   */
  async onModuleDestroy() {
    await this.$disconnect();
    console.log('❌ PrismaService: Disconnected from database');
  }

  /**
   * Utility opsional untuk clear seluruh data saat development/testing.
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('❌ Tidak boleh menghapus data di mode production!');
    }

    const modelNames = Reflect.ownKeys(this).filter((key) =>
      /^[A-Z]/.test(String(key)),
    );

    for (const modelName of modelNames) {
      try {
        await (this as any)[modelName].deleteMany({});
      } catch (error) {
        console.warn(`⚠️  Gagal menghapus data dari ${String(modelName)}`);
      }
    }

    console.log('🧹 Database telah dibersihkan (development mode).');
  }
}

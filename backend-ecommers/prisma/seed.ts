import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Hash password sekali saja agar efisien
  const hashedPassword = await hash('password123', 10);

  // Cek apakah tenant sudah ada (hindari duplicate)
  const existingTenant = await prisma.tenant.findUnique({
    where: { code: 'salwa' },
  });

  if (existingTenant) {
    console.log('⚠️ Tenant "salwa" sudah ada, skip seeding.');
    return;
  }

  // Buat tenant baru + 2 user (owner dan customer)
  const tenant = await prisma.tenant.create({
    data: {
      code: 'salwa',
      name: 'Toko Salwa',
      email: 'info@salwa.com',
      phone: '081234567890',
      address: 'Jl. Merdeka No. 10, Jakarta',
      users: {
        create: [
          {
            name: 'Hamzah Robbany',
            email: 'owner@salwa.com',
            password: hashedPassword,
            role: 'OWNER',
          },
          {
            name: 'John Customer',
            email: 'customer@salwa.com',
            password: hashedPassword,
            role: 'CUSTOMER',
          },
        ],
      },
    },
    include: { users: true },
  });

  console.log('✅ Seed selesai:');
  console.table({
    Tenant: tenant.name,
    Owner: tenant.users[0].email,
    Customer: tenant.users[1].email,
  });
}

// Jalankan seed dengan error handling yang baik
main()
  .catch((err) => {
    console.error('❌ Seed gagal:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient, Role, OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting full database seed...');

  // ===================================================================
  // 🧹 Hapus data lama (bersih total)
  // ===================================================================
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.subscriber.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  // ===================================================================
  // 🏢 1. Tenant & Users
  // ===================================================================
  const hashedPassword = await hash('password123', 10);

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
            role: Role.OWNER,
          },
          {
            name: 'John Customer',
            email: 'customer@salwa.com',
            password: hashedPassword,
            role: Role.CUSTOMER,
          },
        ],
      },
    },
    include: { users: true },
  });

  const owner = tenant.users.find((u) => u.role === 'OWNER')!;
  const customer = tenant.users.find((u) => u.role === 'CUSTOMER')!;

  console.log('✅ Tenant & users created.');

  // ===================================================================
  // ☕ 2. Products
  // ===================================================================
  const productsData = [
    {
      tenantId: tenant.id,
      name: 'Kopi Arabica Gayo',
      category: 'Coffee',
      description: 'Kopi arabica premium dari Gayo, Aceh',
      price: 85000,
      stock: 25,
      image: 'https://example.com/images/gayo.jpg',
    },
    {
      tenantId: tenant.id,
      name: 'Kopi Robusta Lampung',
      category: 'Coffee',
      description: 'Kopi robusta dengan cita rasa kuat khas Lampung',
      price: 65000,
      stock: 40,
      image: 'https://example.com/images/lampung.jpg',
    },
    {
      tenantId: tenant.id,
      name: 'Kopi Luwak Premium',
      category: 'Specialty',
      description: 'Kopi langka dengan aroma lembut dan rasa kompleks',
      price: 250000,
      stock: 10,
      image: 'https://example.com/images/luwak.jpg',
    },
  ];

  const products = await prisma.product.createMany({ data: productsData });
  const productList = await prisma.product.findMany({ where: { tenantId: tenant.id } });

  console.log(`✅ ${products.count} products created.`);

  // ===================================================================
  // 📦 3. Stocks
  // ===================================================================
  for (const product of productList) {
    await prisma.stock.create({
      data: {
        tenantId: tenant.id,
        productId: product.id,
        location: 'Gudang Utama',
        quantity: product.stock,
      },
    });
  }

  console.log('✅ Stock created for all products.');

  // ===================================================================
  // ✉️ 4. Subscribers
  // ===================================================================
  await prisma.subscriber.createMany({
    data: [
      {
        tenantId: tenant.id,
        email: 'subscriber1@salwa.com',
        name: 'Rina',
        subscribed: true,
      },
      {
        tenantId: tenant.id,
        email: 'subscriber2@salwa.com',
        name: 'Budi',
        subscribed: true,
      },
    ],
  });

  console.log('✅ Subscribers added.');

  // ===================================================================
  // 🧾 5. Orders & OrderItems
  // ===================================================================
  const order = await prisma.order.create({
    data: {
      tenantId: tenant.id,
      userId: customer.id,
      totalAmount: 150000,
      status: OrderStatus.PAID,
      items: {
        create: [
          {
            tenantId: tenant.id,
            productId: productList[0].id,
            quantity: 2,
            subtotal: 170000,
          },
          {
            tenantId: tenant.id,
            productId: productList[1].id,
            quantity: 1,
            subtotal: 65000,
          },
        ],
      },
    },
    include: { items: true },
  });

  console.log('✅ Order created with items.');

  // ===================================================================
  // 💳 6. Payment
  // ===================================================================
  await prisma.payment.create({
    data: {
      orderId: order.id,
      method: PaymentMethod.QRIS,
      amount: order.totalAmount,
      status: PaymentStatus.SUCCESS,
      transactionId: `TXN-${Date.now()}`,
    },
  });

  console.log('✅ Payment created.');

  console.log('🎉 Full seed completed successfully!');
}

// Jalankan seed
main()
  .catch((err) => {
    console.error('❌ Seed gagal:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

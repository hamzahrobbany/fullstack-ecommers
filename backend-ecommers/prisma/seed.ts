import {
  PrismaClient,
  Role,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting full database seed...');

  // =============================================================
  // 🧹 Clean existing data (optional for dev only)
  // =============================================================
  console.log('🧹 Cleaning old data...');
  await prisma.$transaction([
    prisma.payment.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.stock.deleteMany(),
    prisma.product.deleteMany(),
    prisma.subscriber.deleteMany(),
    prisma.user.deleteMany(),
    prisma.tenant.deleteMany(),
  ]);

  // =============================================================
  // 🏢 1. Tenant + Users
  // =============================================================
  console.log('🏢 Creating tenant & users...');
  const hashedPassword = await hash('password123', 10);

  const tenant = await prisma.tenant.upsert({
    where: { code: 'salwa' },
    update: {},
    create: {
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
  console.log(`✅ Tenant '${tenant.name}' with users created.`);

  // =============================================================
  // ☕ 2. Products
  // =============================================================
  console.log('☕ Creating products...');
  const productsData = [
    {
      tenantId: tenant.id,
      name: 'Kopi Arabica Gayo',
      category: 'Coffee',
      description: 'Kopi arabica premium dari Gayo, Aceh.',
      price: 85000,
      stock: 25,
      image: 'https://example.com/images/gayo.jpg',
    },
    {
      tenantId: tenant.id,
      name: 'Kopi Robusta Lampung',
      category: 'Coffee',
      description: 'Kopi robusta dengan cita rasa kuat khas Lampung.',
      price: 65000,
      stock: 40,
      image: 'https://example.com/images/lampung.jpg',
    },
    {
      tenantId: tenant.id,
      name: 'Kopi Luwak Premium',
      category: 'Specialty',
      description: 'Kopi langka dengan aroma lembut dan rasa kompleks.',
      price: 250000,
      stock: 10,
      image: 'https://example.com/images/luwak.jpg',
    },
  ];

  await prisma.product.createMany({ data: productsData });
  const productList = await prisma.product.findMany({ where: { tenantId: tenant.id } });
  console.log(`✅ ${productList.length} products created.`);

  // =============================================================
  // 📦 3. Stocks
  // =============================================================
  console.log('📦 Generating stock data...');
  await Promise.all(
    productList.map((product) =>
      prisma.stock.create({
        data: {
          tenantId: tenant.id,
          productId: product.id,
          location: 'Gudang Utama',
          quantity: product.stock,
        },
      }),
    ),
  );
  console.log('✅ Stock records created.');

  // =============================================================
  // ✉️ 4. Subscribers
  // =============================================================
  console.log('✉️ Creating subscribers...');
  await prisma.subscriber.createMany({
    data: [
      {
        tenantId: tenant.id,
        email: 'subscriber1@salwa.com',
        name: 'Rina',
      },
      {
        tenantId: tenant.id,
        email: 'subscriber2@salwa.com',
        name: 'Budi',
      },
    ],
  });
  console.log('✅ Subscribers added.');

  // =============================================================
  // 🧾 5. Orders + OrderItems
  // =============================================================
  console.log('🧾 Creating order & items...');
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
  console.log(`✅ Order with ${order.items.length} items created.`);

  // =============================================================
  // 💳 6. Payment
  // =============================================================
  console.log('💳 Creating payment...');
  await prisma.payment.create({
    data: {
      tenantId: tenant.id,
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

// 🚀 Run the seed
main()
  .catch((err) => {
    console.error('❌ Seed gagal:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

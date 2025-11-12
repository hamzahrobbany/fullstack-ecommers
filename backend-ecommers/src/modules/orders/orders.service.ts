import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';
import { OrderStatus } from '@/prisma/enums';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.order.findMany({
      where: { tenantId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        items: {
          select: {
            id: true,
            productId: true,
            quantity: true,
            subtotal: true,
          },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, tenantId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        items: {
          select: {
            id: true,
            productId: true,
            quantity: true,
            subtotal: true,
          },
        },
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order dengan ID "${id}" tidak ditemukan.`);
    }

    return order;
  }

  async updateStatus(id: string, tenantId: string, status: OrderStatus) {
    await this.ensureOrderExists(id, tenantId);

    return this.prisma.order.update({
      where: { id },
      data: { status },
      include: {
        payment: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  private async ensureOrderExists(id: string, tenantId: string) {
    const exists = await this.prisma.order.findFirst({ where: { id, tenantId } });
    if (!exists) {
      throw new NotFoundException(`Order dengan ID "${id}" tidak ditemukan.`);
    }
  }
}

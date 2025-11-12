import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';
import { OrderStatus } from '@/prisma/enums';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByTenant(tenantId: string | null) {
    const validTenantId = this.ensureTenant(tenantId);
    return this.prisma.order.findMany({
      where: { tenantId: validTenantId },
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

  async findOneByTenant(id: string, tenantId: string | null) {
    const validTenantId = this.ensureTenant(tenantId);

    const order = await this.prisma.order.findFirst({
      where: { id, tenantId: validTenantId },
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

  async updateStatus(id: string, tenantId: string | null, status: OrderStatus) {
    const validTenantId = this.ensureTenant(tenantId);
    await this.ensureOrderExists(id, validTenantId);

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
    const exists = await this.prisma.order.findFirst({
      where: { id, tenantId },
    });
    if (!exists) {
      throw new NotFoundException(`Order dengan ID "${id}" tidak ditemukan.`);
    }
  }

  private ensureTenant(tenantId: string | null | undefined): string {
    if (!tenantId) {
      throw new BadRequestException('Tenant context tidak ditemukan.');
    }

    return tenantId;
  }
}

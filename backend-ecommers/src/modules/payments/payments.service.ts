import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';
import { PaymentStatus } from '@/prisma/enums';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.payment.findMany({
      where: {
        order: { tenantId },
      },
      include: this.getDefaultInclude(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, order: { tenantId } },
      include: this.getDefaultInclude(),
    });

    if (!payment) {
      throw new NotFoundException(`Pembayaran dengan ID "${id}" tidak ditemukan.`);
    }

    return payment;
  }

  async updateStatus(
    id: string,
    tenantId: string,
    status: PaymentStatus,
    extras: { transactionId?: string | null } = {},
  ) {
    await this.ensurePaymentExists(id, tenantId);

    return this.prisma.payment.update({
      where: { id },
      data: {
        status,
        ...extras,
      },
      include: this.getDefaultInclude(),
    });
  }

  private async ensurePaymentExists(id: string, tenantId: string) {
    const exists = await this.prisma.payment.findFirst({
      where: { id, order: { tenantId } },
    });

    if (!exists) {
      throw new NotFoundException(`Pembayaran dengan ID "${id}" tidak ditemukan.`);
    }
  }

  private getDefaultInclude() {
    return {
      order: {
        select: {
          id: true,
          tenantId: true,
          status: true,
          totalAmount: true,
        },
      },
    } as const;
  }
}

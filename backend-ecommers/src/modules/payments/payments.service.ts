import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';
import { PaymentStatus } from '@/prisma/enums';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByTenant(tenantId: string | null) {
    const validTenantId = this.ensureTenant(tenantId);
    return this.prisma.payment.findMany({
      where: {
        tenantId: validTenantId,
      },
      include: this.getDefaultInclude(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneByTenant(id: string, tenantId: string | null) {
    const validTenantId = this.ensureTenant(tenantId);

    const payment = await this.prisma.payment.findFirst({
      where: { id, tenantId: validTenantId },
      include: this.getDefaultInclude(),
    });

    if (!payment) {
      throw new NotFoundException(
        `Pembayaran dengan ID "${id}" tidak ditemukan.`,
      );
    }

    return payment;
  }

  async updateStatus(
    id: string,
    tenantId: string | null,
    status: PaymentStatus,
    extras: { transactionId?: string | null } = {},
  ) {
    const validTenantId = this.ensureTenant(tenantId);
    await this.ensurePaymentExists(id, validTenantId);

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
      where: { id, tenantId },
    });

    if (!exists) {
      throw new NotFoundException(
        `Pembayaran dengan ID "${id}" tidak ditemukan.`,
      );
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

  private ensureTenant(tenantId: string | null | undefined): string {
    if (!tenantId) {
      throw new BadRequestException('Tenant context tidak ditemukan.');
    }

    return tenantId;
  }
}

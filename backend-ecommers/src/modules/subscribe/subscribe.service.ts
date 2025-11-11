import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SubscribeService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.subscriber.findMany();
  }

  async addSubscriber({ tenantId, email, name }: any) {
    return this.prisma.subscriber.upsert({
      where: { tenantId_email: { tenantId, email } },
      update: { subscribed: true },
      create: { tenantId, email, name },
    });
  }
}

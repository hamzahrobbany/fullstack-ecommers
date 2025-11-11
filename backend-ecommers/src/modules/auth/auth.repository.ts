import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { RegisterDto, REGISTER_ROLE_VALUES } from './dto/register.dto';

type Role = (typeof REGISTER_ROLE_VALUES)[number];

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserByEmail(email: string, tenantId: string) {
    const prisma = this.prisma as any;
    return prisma.user.findFirst({
      where: { email: email.toLowerCase(), tenantId },
    });
  }

  findUserById(id: string, tenantId: string) {
    const prisma = this.prisma as any;
    return prisma.user.findFirst({
      where: { id, tenantId },
    });
  }

  findByEmail(email: string) {
    const prisma = this.prisma as any;
    return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  async createUser(
    dto: Pick<RegisterDto, 'name' | 'email' | 'role'> & {
      password: string;
      tenantId: string;
    },
  ) {
    const normalizedRole = dto.role?.toUpperCase?.() ?? 'CUSTOMER';
    const role = REGISTER_ROLE_VALUES.includes(normalizedRole as Role)
      ? (normalizedRole as Role)
      : 'CUSTOMER';

    const prisma = this.prisma as any;
    return prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: dto.password,
        role,
        tenantId: dto.tenantId,
      },
    });
  }

  async saveRefreshToken(userId: string, token: string, expiresAt: Date) {
    const prisma = this.prisma as any;
    await prisma.refreshToken.create({
      data: { userId, token, expiresAt },
    });
  }

  async revokeRefreshToken(token: string) {
    const prisma = this.prisma as any;
    await prisma.refreshToken.deleteMany({ where: { token } });
  }

  async validateRefreshToken(userId: string, token: string) {
    const prisma = this.prisma as any;
    const tokenRecord = await prisma.refreshToken.findFirst({
      where: {
        userId,
        token,
        expiresAt: { gt: new Date() },
      },
    });
    return !!tokenRecord;
  }
}

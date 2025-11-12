import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { PasswordUtil } from '../auth/utils/password.util';
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ===========================================================
  // 🧩 CREATE USER (Tenant-Aware)
  // ===========================================================
  async create(dto: CreateUserDto, tenantId: string | null) {
    const validTenantId = this.ensureTenant(tenantId);

    // 🔹 Cek email unik per tenant
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email, tenantId: validTenantId },
    });
    if (existing) {
      throw new BadRequestException(
        `Email "${dto.email}" sudah terdaftar di tenant ini.`,
      );
    }

    const hashed = await PasswordUtil.hash(dto.password);

    const allowedRoles = new Set(['OWNER', 'ADMIN', 'CUSTOMER']);
    const normalizedRole = dto.role?.toUpperCase?.() ?? 'CUSTOMER';
    const role = allowedRoles.has(normalizedRole) ? normalizedRole : 'CUSTOMER';

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashed,
        role,
        tenantId: validTenantId,
      },
    });

    return user;
  }

  // ===========================================================
  // 📜 FIND ALL (Tenant-Aware)
  // ===========================================================
  async findAllByTenant(tenantId: string | null) {
    const validTenantId = this.ensureTenant(tenantId);

    return this.prisma.user.findMany({
      where: { tenantId: validTenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ===========================================================
  // 🔍 FIND BY ID (Tenant-Aware)
  // ===========================================================
  async findById(id: string, tenantId: string | null) {
    const validTenantId = this.ensureTenant(tenantId);

    const user = await this.prisma.user.findFirst({
      where: { id, tenantId: validTenantId },
    });
    if (!user) {
      throw new NotFoundException(`User dengan ID ${id} tidak ditemukan.`);
    }

    return user;
  }

  // ===========================================================
  // 🧱 UPDATE USER
  // ===========================================================
  async update(id: string, dto: UpdateUserDto, tenantId: string | null) {
    const user = await this.findById(id, tenantId);

    // 🔹 Validasi email unik jika diubah
    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: dto.email, tenantId: user.tenantId },
      });
      if (existing) {
        throw new BadRequestException('Email sudah digunakan di tenant ini.');
      }
    }

    const data: any = { ...dto };
    if (dto.password) {
      data.password = await PasswordUtil.hash(dto.password);
    }

    return this.prisma.user.update({
      where: { id: user.id },
      data,
    });
  }

  // ===========================================================
  // 🗑️ DELETE USER
  // ===========================================================
  async remove(id: string, tenantId: string | null) {
    const user = await this.findById(id, tenantId);
    return this.prisma.user.delete({ where: { id: user.id } });
  }

  private ensureTenant(tenantId: string | null | undefined): string {
    if (!tenantId) {
      throw new BadRequestException('Tenant context tidak ditemukan.');
    }
    return tenantId;
  }
}

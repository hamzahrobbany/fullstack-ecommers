import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { PasswordUtil } from '../auth/utils/password.util';
import { Tenant } from '../tenants/entities/tenant.entity';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ===========================================================
  // 🧩 CREATE USER (Tenant-Aware)
  // ===========================================================
  async create(dto: CreateUserDto, tenant: Tenant) {
    if (!tenant?.id) {
      throw new BadRequestException('Tenant context tidak ditemukan.');
    }

    // 🔹 Cek email unik per tenant
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email, tenantId: tenant.id },
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
        tenantId: tenant.id,
      },
    });

    return user;
  }

  // ===========================================================
  // 📜 FIND ALL (Tenant-Aware)
  // ===========================================================
  async findAll(tenant: Tenant) {
    if (!tenant?.id) throw new ForbiddenException('Tenant tidak valid.');

    return this.prisma.user.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ===========================================================
  // 🔍 FIND BY ID (Tenant-Aware)
  // ===========================================================
  async findById(id: string, tenant: Tenant) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User dengan ID ${id} tidak ditemukan.`);
    }

    if (user.tenantId !== tenant.id) {
      throw new ForbiddenException('Akses ke user dari tenant lain tidak diizinkan.');
    }

    return user;
  }

  // ===========================================================
  // 🧱 UPDATE USER
  // ===========================================================
  async update(id: string, dto: UpdateUserDto, tenant: Tenant) {
    const user = await this.findById(id, tenant);

    // 🔹 Validasi email unik jika diubah
    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: dto.email, tenantId: tenant.id },
      });
      if (existing) {
        throw new BadRequestException('Email sudah digunakan di tenant ini.');
      }
    }

    let data: any = { ...dto };
    if (dto.password) {
      data.password = await PasswordUtil.hash(dto.password);
    }

    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  // ===========================================================
  // 🗑️ DELETE USER
  // ===========================================================
  async remove(id: string, tenant: Tenant) {
    await this.findById(id, tenant);
    return this.prisma.user.delete({ where: { id } });
  }
}

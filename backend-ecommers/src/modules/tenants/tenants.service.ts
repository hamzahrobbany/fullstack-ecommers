import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { CreateTenantWithOwnerDto } from './dto/create-tenant-with-owner.dto';
import { PasswordUtil } from '../auth/utils/password.util';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  private get orm() {
    return this.prisma as any;
  }

  // ===========================================================
  // 🧩 CREATE TENANT
  // ===========================================================
  async create(dto: CreateTenantDto) {
    const code = dto.code.toLowerCase().trim();
    const domain = dto.domain?.toLowerCase().trim() ?? null;

    // 🔹 Validasi unik code & domain
    await this.ensureUniqueFields(code, domain);

    return this.orm.tenant.create({
      data: { ...dto, code, domain },
    });
  }

  // ===========================================================
  // 📜 FIND ALL
  // ===========================================================
  async findAll() {
    return this.orm.tenant.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // ===========================================================
  // 🔍 FIND ONE BY ID
  // ===========================================================
  async findById(id: string) {
    const tenant = await this.orm.tenant.findUnique({ where: { id } });
    if (!tenant)
      throw new NotFoundException(`Tenant dengan ID "${id}" tidak ditemukan`);
    return tenant;
  }

  // ===========================================================
  // 🔍 FIND ONE BY CODE
  // ===========================================================
  async findByCode(code: string) {
    if (!code) {
      return null;
    }
    const normalized = code.toLowerCase().trim();
    return this.prisma.tenant.findUnique({
      where: { code: normalized },
    });
  }

  // ===========================================================
  // 🔍 FIND ONE BY DOMAIN
  // ===========================================================
  async findByDomain(domain: string) {
    if (!domain) throw new BadRequestException('Domain wajib diisi');
    const tenant = await this.orm.tenant.findUnique({
      where: { domain: domain.toLowerCase().trim() },
    });
    if (!tenant)
      throw new NotFoundException(
        `Tenant dengan domain "${domain}" tidak ditemukan`,
      );
    return tenant;
  }

  // ===========================================================
  // 🧱 UPDATE TENANT
  // ===========================================================
  async update(id: string, dto: UpdateTenantDto) {
    const tenant = await this.findById(id);

    const newCode = dto.code?.toLowerCase().trim();
    const newDomain = dto.domain?.toLowerCase().trim();

    // 🔹 Validasi unik jika diubah
    if (newCode && newCode !== tenant.code) {
      await this.ensureCodeUnique(newCode, id);
    }

    if (newDomain && newDomain !== tenant.domain) {
      await this.ensureDomainUnique(newDomain, id);
    }

    return this.orm.tenant.update({
      where: { id },
      data: { ...dto, code: newCode ?? tenant.code, domain: newDomain ?? tenant.domain },
    });
  }

  // ===========================================================
  // 🗑️ DELETE TENANT
  // ===========================================================
  async remove(id: string) {
    await this.findById(id);
    await this.orm.tenant.delete({ where: { id } });
    return { message: `Tenant dengan ID "${id}" berhasil dihapus` };
  }

  // ===========================================================
  // 🧩 CREATE TENANT + OWNER
  // ===========================================================
  async createTenantWithOwner(dto: CreateTenantWithOwnerDto) {
    const code = dto.code.toLowerCase().trim();
    const email = dto.ownerEmail.toLowerCase().trim();

    // 🔹 Cek kode tenant
    const existingTenant = await this.orm.tenant.findUnique({
      where: { code },
    });
    if (existingTenant)
      throw new BadRequestException(`Kode tenant "${code}" sudah digunakan`);

    // 🔹 Cek email owner
    const existingOwner = await this.orm.user.findUnique({
      where: { email },
    });
    if (existingOwner)
      throw new BadRequestException(`Email "${email}" sudah digunakan`);

    // 🔹 Buat tenant
    const tenant = await this.orm.tenant.create({
      data: {
        code,
        name: dto.name,
        domain: dto.domain?.toLowerCase().trim() ?? code,
      },
    });

    // 🔹 Hash password owner
    const hashedPassword = await PasswordUtil.hash(dto.ownerPassword);

    // 🔹 Buat user owner
    const owner = await this.orm.user.create({
      data: {
        name: dto.ownerName,
        email,
        password: hashedPassword,
        role: 'OWNER',
        tenantId: tenant.id,
      },
    });

    const { password: _pwd, ...safeOwner } = owner;
    return { tenant, owner: safeOwner };
  }

  // ===========================================================
  // 🧩 INTERNAL HELPERS
  // ===========================================================
  private async ensureUniqueFields(code: string, domain: string | null) {
    if (code) await this.ensureCodeUnique(code);
    if (domain) await this.ensureDomainUnique(domain);
  }

  private async ensureCodeUnique(code: string, excludeId?: string) {
    const tenant = await this.orm.tenant.findUnique({ where: { code } });
    if (tenant && tenant.id !== excludeId) {
      throw new BadRequestException(`Kode "${code}" sudah digunakan`);
    }
  }

  private async ensureDomainUnique(domain: string, excludeId?: string) {
    const tenant = await this.orm.tenant.findUnique({ where: { domain } });
    if (tenant && tenant.id !== excludeId) {
      throw new BadRequestException(`Domain "${domain}" sudah digunakan`);
    }
  }
}

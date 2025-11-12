import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string | null) {
    const validTenantId = this.ensureTenant(tenantId);

    return this.prisma.product.findMany({
      where: { tenantId: validTenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string | null) {
    const validTenantId = this.ensureTenant(tenantId);
    return this.ensureProduct(id, validTenantId);
  }

  create(tenantId: string | null, dto: CreateProductDto) {
    const validTenantId = this.ensureTenant(tenantId);
    return this.prisma.product.create({
      data: {
        tenantId: validTenantId,
        name: dto.name,
        category: dto.category,
        description: dto.description,
        price: dto.price,
        stock: dto.stock ?? 0,
        image: dto.image,
      },
    });
  }

  async update(id: string, tenantId: string | null, dto: UpdateProductDto) {
    const validTenantId = this.ensureTenant(tenantId);
    await this.ensureProduct(id, validTenantId);
    return this.prisma.product.update({
      where: { id },
      data: {
        ...dto,
        stock: dto.stock ?? undefined,
      },
    });
  }

  async delete(id: string, tenantId: string | null) {
    const validTenantId = this.ensureTenant(tenantId);
    await this.ensureProduct(id, validTenantId);
    return this.prisma.product.delete({ where: { id } });
  }

  private async ensureProduct(id: string, tenantId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
    });

    if (!product) {
      throw new NotFoundException(
        `Produk dengan ID "${id}" tidak ditemukan untuk tenant ini`,
      );
    }

    return product;
  }

  private ensureTenant(tenantId: string | null | undefined): string {
    if (!tenantId) {
      throw new BadRequestException('Tenant context tidak ditemukan.');
    }

    return tenantId;
  }
}

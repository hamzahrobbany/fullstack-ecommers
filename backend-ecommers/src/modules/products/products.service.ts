import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string) {
    return this.prisma.product.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    return this.ensureProduct(id, tenantId);
  }

  create(tenantId: string, dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        tenantId,
        name: dto.name,
        category: dto.category,
        description: dto.description,
        price: dto.price,
        stock: dto.stock ?? 0,
        image: dto.image,
      },
    });
  }

  async update(id: string, tenantId: string, dto: UpdateProductDto) {
    await this.ensureProduct(id, tenantId);
    return this.prisma.product.update({
      where: { id },
      data: {
        ...dto,
        stock: dto.stock ?? undefined,
      },
    });
  }

  async delete(id: string, tenantId: string) {
    await this.ensureProduct(id, tenantId);
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
}

import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { PrismaModule } from '../../prisma/prisma.module'; // ✅ import PrismaModule

@Module({
  imports: [PrismaModule], // ✅ pastikan ini ada
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}

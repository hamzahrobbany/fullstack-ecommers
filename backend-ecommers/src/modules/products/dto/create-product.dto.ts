import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ description: 'Nama produk', example: 'Kopi Arabica' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(191)
  name!: string;

  @ApiPropertyOptional({ description: 'Kategori produk', example: 'Minuman' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ description: 'Deskripsi singkat produk' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Harga produk dalam rupiah', example: 25000 })
  @IsInt()
  @IsPositive()
  price!: number;

  @ApiPropertyOptional({ description: 'Stok awal produk', example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ description: 'URL gambar produk' })
  @IsOptional()
  @IsString()
  image?: string;
}

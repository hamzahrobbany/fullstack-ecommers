import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({
    example: 'salwa',
    description: 'Kode unik tenant (wajib unik, digunakan untuk identifikasi/subdomain)',
  })
  @IsString()
  code: string;

  @ApiProperty({
    example: 'Toko Salwa',
    description: 'Nama tenant atau nama toko',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'salwa.mysite.com',
    description: 'Subdomain atau custom domain tenant',
    required: false,
  })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiProperty({
    example: 'Jl. Merdeka No. 10, Jakarta',
    description: 'Alamat toko / tenant',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    example: 'admin@salwa.com',
    description: 'Email kontak utama tenant',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: '+62 812-3456-7890',
    description: 'Nomor telepon toko / tenant',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;
}

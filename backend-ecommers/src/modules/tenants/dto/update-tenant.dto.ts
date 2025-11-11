import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateTenantDto } from './create-tenant.dto';
import { IsOptional, IsString, IsEmail, ValidateIf } from 'class-validator';

/**
 * DTO untuk update data Tenant.
 * Menggunakan PartialType agar semua field opsional,
 * ditambah validasi kondisional untuk keamanan input.
 */
export class UpdateTenantDto extends PartialType(CreateTenantDto) {
  @ApiProperty({
    example: 'Toko Salwa Updated',
    required: false,
    description: 'Nama tenant (opsional, hanya jika ingin diubah)',
  })
  @ValidateIf((o) => o.name !== undefined)
  @IsString({ message: 'Nama harus berupa string' })
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 'salwa',
    required: false,
    description: 'Kode unik tenant (opsional, hanya jika ingin diubah)',
  })
  @ValidateIf((o) => o.code !== undefined)
  @IsString({ message: 'Code harus berupa string' })
  @IsOptional()
  code?: string;

  @ApiProperty({
    example: 'salwa-store.mysite.com',
    required: false,
    description: 'Domain unik tenant (opsional, hanya jika ingin diubah)',
  })
  @ValidateIf((o) => o.domain !== undefined)
  @IsString({ message: 'Domain harus berupa string' })
  @IsOptional()
  domain?: string;

  @ApiProperty({
    example: 'Jl. Merdeka No. 12, Jakarta',
    required: false,
    description: 'Alamat tenant (opsional)',
  })
  @ValidateIf((o) => o.address !== undefined)
  @IsString({ message: 'Address harus berupa string' })
  @IsOptional()
  address?: string;

  @ApiProperty({
    example: 'admin@salwa.com',
    required: false,
    description: 'Email tenant (opsional)',
  })
  @ValidateIf((o) => o.email !== undefined)
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: '+62 812-3456-7890',
    required: false,
    description: 'Nomor telepon tenant (opsional)',
  })
  @ValidateIf((o) => o.phone !== undefined)
  @IsString({ message: 'Phone harus berupa string' })
  @IsOptional()
  phone?: string;
}

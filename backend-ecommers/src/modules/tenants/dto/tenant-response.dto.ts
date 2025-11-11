import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO untuk response data Tenant.
 * Menjamin konsistensi antara schema Prisma dan output API.
 */
export class TenantResponseDto {
  @ApiProperty({
    example: 'a4f2f4aa-6d7e-4976-baab-606e930caf59',
    description: 'ID unik tenant (UUID)',
  })
  id: string;

  @ApiProperty({
    example: 'salwa',
    description: 'Kode unik tenant, digunakan untuk header X-Tenant-ID atau subdomain',
  })
  code: string;

  @ApiProperty({
    example: 'Toko Salwa',
    description: 'Nama tenant atau toko',
  })
  name: string;

  @ApiProperty({
    example: 'salwa.mysite.com',
    required: false,
    description: 'Domain atau subdomain tenant (opsional)',
  })
  domain?: string;

  @ApiProperty({
    example: 'Jl. Merdeka No. 10',
    required: false,
    description: 'Alamat toko atau tenant',
  })
  address?: string;

  @ApiProperty({
    example: 'admin@salwa.com',
    required: false,
    description: 'Email kontak utama tenant',
  })
  email?: string;

  @ApiProperty({
    example: '+62 812-3456-7890',
    required: false,
    description: 'Nomor telepon tenant',
  })
  phone?: string;

  @ApiProperty({
    example: '2025-11-08T10:20:30.000Z',
    description: 'Tanggal tenant dibuat',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2025-11-08T10:21:00.000Z',
    description: 'Tanggal tenant terakhir diperbarui',
  })
  updatedAt: Date;
}

import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

/**
 * 🏢 Tenant Entity — sinkron dengan Prisma model Tenant
 * -------------------------------------------------------
 * Representasi kelas TypeScript untuk model Prisma `Tenant`.
 * Digunakan untuk response DTO, middleware context, dan dokumentasi Swagger.
 */
export class Tenant {
  @ApiProperty({
    example: 'c9a1f9c2-87e5-4a0f-8a1b-49dc421cf16e',
    description: 'UUID unik tenant (primary key)',
  })
  id: string;

  @ApiProperty({
    example: 'salwa',
    description:
      'Kode unik tenant (digunakan untuk header X-Tenant-ID atau subdomain)',
  })
  code: string;

  @ApiProperty({
    example: 'Toko Salwa',
    description: 'Nama tenant (nama toko / koperasi / store)',
  })
  name: string;

  @ApiProperty({
    example: 'salwa.mysite.com',
    nullable: true,
    description: 'Domain unik tenant (opsional)',
  })
  domain: string | null;

  @ApiProperty({
    example: 'Jl. Merdeka No. 10, Jakarta',
    nullable: true,
    description: 'Alamat lengkap tenant',
  })
  address: string | null;

  @ApiProperty({
    example: 'admin@salwa.com',
    nullable: true,
    description: 'Email utama tenant',
  })
  email: string | null;

  @ApiProperty({
    example: '+62 812-3456-7890',
    nullable: true,
    description: 'Nomor telepon tenant',
  })
  phone: string | null;

  @ApiProperty({
    example: '2025-11-08T12:00:00.000Z',
    description: 'Tanggal pembuatan tenant',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2025-11-08T12:10:00.000Z',
    description: 'Tanggal pembaruan terakhir tenant',
  })
  updatedAt: Date;

  // ⚙️ Relasi ke user
  @ApiProperty({
    type: () => [User],
    required: false,
    description: 'Daftar user yang terdaftar dalam tenant ini',
  })
  users?: User[];
}

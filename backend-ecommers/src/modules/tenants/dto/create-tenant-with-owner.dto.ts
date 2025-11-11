import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  Matches,
  MaxLength,
} from 'class-validator';

/**
 * ============================================================
 * 🏢 CreateTenantWithOwnerDto
 * ============================================================
 * DTO ini digunakan untuk membuat tenant baru bersamaan dengan
 * akun OWNER (pemilik utama tenant).
 *
 * Termasuk field:
 *  - code (unik)
 *  - name
 *  - domain (opsional)
 *  - ownerName, ownerEmail, ownerPassword
 * ============================================================
 */
export class CreateTenantWithOwnerDto {
  @ApiProperty({
    example: 'salwa',
    description:
      'Kode unik tenant (hanya huruf kecil & angka, digunakan untuk identifikasi internal)',
  })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Kode tenant hanya boleh berisi huruf kecil, angka, atau tanda hubung (-)',
  })
  @MaxLength(30)
  code: string;

  @ApiProperty({
    example: 'Toko Salwa',
    description: 'Nama lengkap tenant atau toko',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    example: 'salwa.mysite.com',
    description:
      'Domain unik tenant (opsional). Jika tidak diisi, akan otomatis memakai kode tenant sebagai domain.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  domain?: string; // ✅ sudah ditambahkan agar kompatibel dengan service

  @ApiProperty({
    example: 'Hamzah Robbany',
    description: 'Nama lengkap pemilik tenant (owner)',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  ownerName: string;

  @ApiProperty({
    example: 'owner@salwa.com',
    description: 'Email pemilik tenant (harus unik di seluruh sistem)',
  })
  @IsEmail()
  ownerEmail: string;

  @ApiProperty({
    example: 'password123',
    description: 'Password akun pemilik tenant (minimal 6 karakter)',
  })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  ownerPassword: string;
}

import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  MinLength,
} from 'class-validator';

export const REGISTER_ROLE_VALUES = ['OWNER', 'ADMIN', 'CUSTOMER'] as const;
export type RegisterRole = (typeof REGISTER_ROLE_VALUES)[number];

export class RegisterDto {
  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'salwa',
    description: 'Kode tenant tempat user akan didaftarkan',
  })
  @IsNotEmpty()
  tenantCode: string;

  @ApiProperty({
    example: 'CUSTOMER',
    enum: REGISTER_ROLE_VALUES,
    required: false,
    description:
      'Peran opsional untuk user baru. Nilai default CUSTOMER jika tidak dikirim.',
  })
  @IsOptional()
  @IsIn(REGISTER_ROLE_VALUES)
  role?: RegisterRole;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'owner@salwa.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string;

  @ApiPropertyOptional({
    example: 'salwa',
    description:
      'Kode tenant opsional saat login tanpa header X-Tenant-Id (misalnya di public login form).',
  })
  @IsOptional()
  @IsString()
  tenantCode?: string;
}

import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { TenantsService } from '../tenants/tenants.service';
import { Tenant } from '../tenants/entities/tenant.entity';

interface TenantAwareRequest extends Request {
  tenant?: Tenant | null;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tenantsService: TenantsService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrasi customer ke tenant yang sudah ada' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User berhasil didaftarkan dan token dikembalikan',
    schema: {
      example: {
        tenant: {
          id: 'tenant-id',
          code: 'tenant-code',
          name: 'Toko Test',
        },
        user: {
          id: 'uuid',
          email: 'user@example.com',
          name: 'John Doe',
          role: 'CUSTOMER',
        },
        tokens: {
          accessToken: 'ACCESS_TOKEN_JWT',
          refreshToken: 'REFRESH_TOKEN_JWT',
        },
      },
    },
  })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login tenant-aware' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login berhasil dan mengembalikan token JWT',
    schema: {
      example: {
        tenant: {
          id: 'tenant-id',
          code: 'tenant-code',
          name: 'Toko Test',
        },
        user: {
          id: 'uuid',
          email: 'user@example.com',
          role: 'CUSTOMER',
        },
        tokens: {
          accessToken: 'ACCESS_TOKEN_JWT',
          refreshToken: 'REFRESH_TOKEN_JWT',
        },
      },
    },
  })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const request = req as TenantAwareRequest;
    let tenant = request.tenant ?? null;

    if (!tenant && dto.tenantCode) {
      try {
        tenant = await this.tenantsService.findByCode(dto.tenantCode);
      } catch (error) {
        if (
          error instanceof NotFoundException ||
          error instanceof BadRequestException
        ) {
          throw new BadRequestException('Tenant context tidak ditemukan.');
        }
        throw error;
      }
    }

    if (!tenant) {
      throw new BadRequestException('Tenant context tidak ditemukan.');
    }

    request.tenant = tenant;
    return this.authService.login(dto, tenant);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh JWT' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Token berhasil diperbarui',
    schema: {
      example: {
        tenant: {
          id: 'tenant-id',
          code: 'tenant-code',
          name: 'Toko Test',
        },
        user: {
          id: 'uuid',
          email: 'user@example.com',
          role: 'CUSTOMER',
        },
        tokens: {
          accessToken: 'NEW_ACCESS_TOKEN',
          refreshToken: 'NEW_REFRESH_TOKEN',
        },
      },
    },
  })
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    const request = req as TenantAwareRequest;
    if (!request.tenant) {
      throw new BadRequestException('Tenant context tidak ditemukan.');
    }

    return this.authService.refresh(dto, request.tenant);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout & hapus token' })
  @ApiBody({ type: LogoutDto })
  @ApiResponse({
    status: 200,
    description: 'Logout berhasil',
    schema: { example: { message: 'Logout berhasil' } },
  })
  async logout(@Body() dto: LogoutDto) {
    return this.authService.logout(dto.refreshToken);
  }
}

import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { TenantsService } from '../tenants/tenants.service';
import { Tenant } from '../tenants/entities/tenant.entity';
import { JwtPayload } from './interfaces/jwt-payload.interface';

interface TenantAwareRequest extends Request {
  tenant?: Tenant | null;
  cookies?: Record<string, string>;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tenantsService: TenantsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private parseCookies(cookieHeader?: string | null) {
    if (!cookieHeader) {
      return {} as Record<string, string>;
    }

    return cookieHeader.split(';').reduce((acc, part) => {
      const [rawKey, ...rawValue] = part.trim().split('=');
      if (!rawKey) {
        return acc;
      }

      acc[rawKey] = decodeURIComponent(rawValue.join('=') ?? '');
      return acc;
    }, {} as Record<string, string>);
  }

  private setRefreshTokenCookie(res: Response | Record<string, unknown>, token: string) {
    this.applyRefreshTokenCookie(res, token, 7 * 24 * 60 * 60);
  }

  private clearRefreshTokenCookie(res: Response | Record<string, unknown>) {
    this.applyRefreshTokenCookie(res, '', 0);
  }

  private applyRefreshTokenCookie(
    res: Response | Record<string, unknown>,
    token: string,
    maxAgeSeconds: number,
  ) {
    const isProduction =
      (this.configService.get<string>('NODE_ENV') ?? process.env.NODE_ENV) ===
      'production';

    const cookieSegments = [
      `kop_rt=${encodeURIComponent(token)}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Lax',
      `Max-Age=${maxAgeSeconds}`,
    ];

    if (isProduction) {
      cookieSegments.push('Secure');
    }

    const cookieString = cookieSegments.join('; ');
    const target = res as unknown as {
      cookie?: (name: string, value: string, options: Record<string, unknown>) => void;
      append?: (name: string, value: string | string[]) => void;
      header?: (name: string, value: string | string[]) => void;
      setHeader?: (name: string, value: string | string[]) => void;
    };

    if (typeof target.cookie === 'function') {
      target.cookie('kop_rt', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction,
        path: '/',
        maxAge: maxAgeSeconds * 1000,
      });
      return;
    }

    if (typeof target.append === 'function') {
      target.append('Set-Cookie', cookieString);
      return;
    }

    if (typeof target.header === 'function') {
      target.header('Set-Cookie', cookieString);
      return;
    }

    if (typeof target.setHeader === 'function') {
      target.setHeader('Set-Cookie', cookieString);
    }
  }

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
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
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
    const result = await this.authService.login(dto, tenant);
    this.setRefreshTokenCookie(res, result.tokens.refreshToken);
    return result;
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh JWT' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Token berhasil diperbarui',
    schema: {
      example: {
        accessToken: 'NEW_ACCESS_TOKEN',
      },
    },
  })
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request, @Res() res: Response) {
    try {
      const request = req as TenantAwareRequest;
      const cookies =
        request.cookies ?? this.parseCookies(request.headers?.cookie ?? null);
      const refreshToken =
        cookies?.kop_rt ?? dto?.refreshToken ?? request.body?.refreshToken ?? null;

      if (!refreshToken) {
        throw new UnauthorizedException('No refresh token provided');
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ??
          process.env.JWT_REFRESH_SECRET,
      });

      const tenant = await this.tenantsService.findByIdOrThrow(payload.tenantId);
      const result = await this.authService.refresh({ refreshToken }, tenant);
      this.setRefreshTokenCookie(res, result.tokens.refreshToken);

      return res.status(200).json({ accessToken: result.tokens.accessToken });
    } catch (error) {
      this.clearRefreshTokenCookie(res);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout & hapus token' })
  @ApiBody({ type: LogoutDto })
  @ApiResponse({
    status: 200,
    description: 'Logout berhasil',
    schema: { example: { message: 'Logout berhasil' } },
  })
  async logout(
    @Body() dto: LogoutDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const request = req as TenantAwareRequest;
    const cookies =
      request.cookies ?? this.parseCookies(request.headers?.cookie ?? null);
    const refreshToken = dto.refreshToken ?? cookies?.kop_rt ?? null;

    if (!refreshToken) {
      this.clearRefreshTokenCookie(res);
      throw new BadRequestException('Refresh token wajib disertakan.');
    }

    try {
      const result = await this.authService.logout(refreshToken);
      this.clearRefreshTokenCookie(res);
      return result;
    } catch (error) {
      this.clearRefreshTokenCookie(res);
      throw error;
    }
  }
}

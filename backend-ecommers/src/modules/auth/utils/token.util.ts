import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { TokenResponse } from '../interfaces/token-response.interface';
import { AuthRepository } from '../auth.repository';

type TenantLike = {
  id: string;
  name?: string | null;
  code?: string | null;
  domain?: string | null;
};

type UserLike = {
  id: string;
  email: string;
  role: string;
};

export class TokenUtil {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiresIn: JwtSignOptions['expiresIn'];
  private readonly refreshExpiresIn: JwtSignOptions['expiresIn'];

  constructor(
    private readonly jwtService: JwtService,
    private readonly authRepository: AuthRepository,
  ) {
    this.accessSecret = process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET ?? '';
    this.refreshSecret = process.env.JWT_REFRESH_SECRET ?? '';
    if (!this.accessSecret || !this.refreshSecret) {
      throw new Error('JWT secrets are not configured.');
    }

    this.accessExpiresIn =
      (process.env.JWT_ACCESS_EXPIRES as JwtSignOptions['expiresIn']) ?? '15m';
    this.refreshExpiresIn =
      (process.env.JWT_REFRESH_EXPIRES as JwtSignOptions['expiresIn']) ?? '7d';
  }

  async generateTokens(user: UserLike, tenant: TenantLike): Promise<TokenResponse> {
    const payload = this.buildPayload(user, tenant);
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.accessSecret,
      expiresIn: this.accessExpiresIn,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.refreshSecret,
      expiresIn: this.refreshExpiresIn,
    });

    await this.saveRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken };
  }

  async verifyRefresh(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync<JwtPayload>(token, {
      secret: this.refreshSecret,
    });
  }

  async saveRefreshToken(userId: string, token: string): Promise<void> {
    const decoded = this.jwtService.decode(token);
    let expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    if (decoded && typeof decoded === 'object' && 'exp' in decoded && decoded.exp) {
      const exp = Number(decoded.exp);
      if (!Number.isNaN(exp)) {
        expiresAt = new Date(exp * 1000);
      }
    }

    await this.authRepository.saveRefreshToken(userId, token, expiresAt);
  }

  private buildPayload(user: UserLike, tenant: TenantLike): JwtPayload {
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: tenant.id,
      tenantCode: this.resolveTenantCode(tenant),
    };
  }

  private resolveTenantCode(tenant: TenantLike): string {
    if (tenant.code && tenant.code.trim().length > 0) {
      return tenant.code;
    }

    if (tenant.domain && tenant.domain.trim().length > 0) {
      return tenant.domain;
    }

    return tenant.id;
  }
}

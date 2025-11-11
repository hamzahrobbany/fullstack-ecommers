import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new Error('JWT refresh secret tidak dikonfigurasi.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request): string | null => {
          const authHeader = req.headers.authorization;
          if (authHeader?.startsWith('Bearer ')) {
            return authHeader.split(' ')[1];
          }

          const refreshFromBody =
            (req.body?.refreshToken as string | undefined) ??
            (req.body?.refresh_token as string | undefined);

          return refreshFromBody ?? null;
        },
      ]),
      secretOrKey: secret,
      passReqToCallback: true,
      ignoreExpiration: false,
    });
  }

  validate(_req: Request, payload: JwtPayload): JwtPayload {
    if (!payload?.tenantId || !payload?.tenantCode) {
      throw new UnauthorizedException('Tenant context tidak ditemukan pada token.');
    }

    return payload;
  }
}

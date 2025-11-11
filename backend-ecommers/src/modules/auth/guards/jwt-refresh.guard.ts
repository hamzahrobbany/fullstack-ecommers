import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard untuk validasi refresh token.
 * Digunakan di endpoint /auth/refresh
 */
@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}

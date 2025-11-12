import {
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

/**
 * Guard gabungan — memeriksa token access dan melempar error 401 jika tidak valid
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt-access') {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private readonly debugEnabled =
    process.env.DEBUG_TENANT_CONTEXT === 'true' ||
    process.env.APP_DEBUG === 'true' ||
    process.env.NODE_ENV !== 'production';

  handleRequest(err: any, user: any, _info: any, context?: ExecutionContext) {
    if (err || !user) {
      throw new UnauthorizedException(
        'Token tidak valid atau sudah kadaluarsa',
      );
    }

    if (this.debugEnabled && context) {
      const request = context.switchToHttp().getRequest<Request>();
      request.debugJwtPayload = user;
      let serializedPayload = '[object Object]';
      try {
        serializedPayload = JSON.stringify(user);
      } catch (serializationError) {
        this.logger.warn(
          `JwtAuthGuard failed to serialize payload for debug: ${(
            serializationError as Error
          ).message}`,
        );
      }
      this.logger.debug(
        `JwtAuthGuard verified payload: ${serializedPayload}`,
      );
    }
    return user;
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}

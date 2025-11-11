import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard gabungan — memeriksa token access dan melempar error 401 jika tidak valid
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt-access') {
  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw new UnauthorizedException('Token tidak valid atau sudah kadaluarsa');
    }
    return user;
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}

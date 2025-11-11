import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TenantsModule } from '../tenants/tenants.module';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PassportModule, JwtModule.register({}), TenantsModule, PrismaModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    LocalStrategy,
    JwtStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}

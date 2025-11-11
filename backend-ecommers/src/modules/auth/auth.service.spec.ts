import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { PasswordUtil } from './utils/password.util';

describe('AuthService', () => {
  let service: AuthService;
  let repo: jest.Mocked<AuthRepository>;
  let jwt: jest.Mocked<JwtService>;

  const tenant = {
    id: 'tenant-123',
    name: 'Tenant Demo',
    domain: 'demo',
    code: 'demo',
  };

  const user = {
    id: 'user-123',
    email: 'user@example.com',
    name: 'Demo User',
    password: 'hashed-password',
    role: 'CUSTOMER',
    tenantId: tenant.id,
  };

  const tokens = {
    accessToken: 'ACCESS_TOKEN',
    refreshToken: 'REFRESH_TOKEN',
  };

  const setupTokenMocks = () => {
    jwt.signAsync.mockResolvedValueOnce(tokens.accessToken).mockResolvedValueOnce(tokens.refreshToken);
    jwt.decode.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 });
  };

  beforeEach(async () => {
    repo = {
      findUserByEmail: jest.fn(),
      findUserById: jest.fn(),
      createUser: jest.fn(),
      validateRefreshToken: jest.fn(),
      revokeRefreshToken: jest.fn(),
      saveRefreshToken: jest.fn(),
    } as unknown as jest.Mocked<AuthRepository>;

    jwt = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
      decode: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    process.env.JWT_ACCESS_SECRET = 'test-access';
    process.env.JWT_REFRESH_SECRET = 'test-refresh';
    process.env.JWT_ACCESS_EXPIRES = '15m';
    process.env.JWT_REFRESH_EXPIRES = '7d';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: repo },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('register', () => {
    it('berhasil membuat user baru dan mengembalikan token', async () => {
      repo.findUserByEmail.mockResolvedValue(null);
      repo.createUser.mockResolvedValue(user);
      setupTokenMocks();

      const hashSpy = jest.spyOn(PasswordUtil, 'hash').mockResolvedValue('hashed');

      const dto = { email: user.email, name: user.name, password: 'secret', role: 'CUSTOMER' } as any;
      const result = await service.register(dto, tenant);

      expect(repo.findUserByEmail).toHaveBeenCalledWith(user.email, tenant.id);
      expect(repo.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: tenant.id, password: 'hashed' }),
      );
      expect(result.user).toMatchObject({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: tenant.id,
      });
      expect(result.tokens).toEqual(tokens);
      expect(result.tenant).toMatchObject({ id: tenant.id, code: tenant.code, name: tenant.name });

      hashSpy.mockRestore();
    });

    it('melempar error jika tenant tidak disediakan', async () => {
      await expect(service.register({} as any, null as any)).rejects.toThrow(BadRequestException);
    });

    it('melempar error jika email sudah terdaftar', async () => {
      repo.findUserByEmail.mockResolvedValue(user);
      await expect(service.register({ email: user.email } as any, tenant)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('login', () => {
    it('berhasil login dengan kredensial benar', async () => {
      repo.findUserByEmail.mockResolvedValue(user);
      setupTokenMocks();
      const compareSpy = jest.spyOn(PasswordUtil, 'compare').mockResolvedValue(true);

      const result = await service.login({ email: user.email, password: 'secret' } as any, tenant);

      expect(repo.findUserByEmail).toHaveBeenCalledWith(user.email, tenant.id);
      expect(result.tokens).toEqual(tokens);
      compareSpy.mockRestore();
    });

    it('melempar error jika tenant hilang', async () => {
      await expect(service.login({} as any, undefined as any)).rejects.toThrow(BadRequestException);
    });

    it('melempar error jika user tidak ditemukan', async () => {
      repo.findUserByEmail.mockResolvedValue(null);
      await expect(service.login({ email: 'x', password: 'y' } as any, tenant)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('melempar error jika password salah', async () => {
      repo.findUserByEmail.mockResolvedValue(user);
      const compareSpy = jest.spyOn(PasswordUtil, 'compare').mockResolvedValue(false);

      await expect(service.login({ email: user.email, password: 'bad' } as any, tenant)).rejects.toThrow(
        UnauthorizedException,
      );

      compareSpy.mockRestore();
    });
  });

  describe('refresh', () => {
    it('mengeluarkan token baru ketika refresh token valid', async () => {
      jwt.verifyAsync.mockResolvedValue({
        sub: user.id,
        email: user.email,
        role: user.role,
        tenantId: tenant.id,
      } as any);
      repo.validateRefreshToken.mockResolvedValue(true);
      repo.findUserById.mockResolvedValue(user);
      repo.revokeRefreshToken.mockResolvedValue(undefined);
      setupTokenMocks();

      const result = await service.refresh({ refreshToken: tokens.refreshToken } as any, tenant);

      expect(jwt.verifyAsync).toHaveBeenCalledWith(tokens.refreshToken, expect.any(Object));
      expect(repo.validateRefreshToken).toHaveBeenCalledWith(user.id, tokens.refreshToken);
      expect(repo.revokeRefreshToken).toHaveBeenCalledWith(tokens.refreshToken);
      expect(result.tokens).toEqual(tokens);
    });

    it('menolak jika refresh token tidak diberikan', async () => {
      await expect(service.refresh({ refreshToken: '' } as any, tenant)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('menolak jika tenant token berbeda', async () => {
      jwt.verifyAsync.mockResolvedValue({
        sub: user.id,
        tenantId: 'other-tenant',
      } as any);

      await expect(service.refresh({ refreshToken: tokens.refreshToken } as any, tenant)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('menolak jika refresh token tidak valid atau dicabut', async () => {
      jwt.verifyAsync.mockResolvedValue({
        sub: user.id,
        tenantId: tenant.id,
      } as any);
      repo.validateRefreshToken.mockResolvedValue(false);

      await expect(service.refresh({ refreshToken: tokens.refreshToken } as any, tenant)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('menolak jika user tidak ditemukan', async () => {
      jwt.verifyAsync.mockResolvedValue({
        sub: user.id,
        tenantId: tenant.id,
      } as any);
      repo.validateRefreshToken.mockResolvedValue(true);
      repo.findUserById.mockResolvedValue(null as any);

      await expect(service.refresh({ refreshToken: tokens.refreshToken } as any, tenant)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('berhasil mencabut refresh token', async () => {
      repo.revokeRefreshToken.mockResolvedValue(undefined);

      const result = await service.logout(tokens.refreshToken);

      expect(repo.revokeRefreshToken).toHaveBeenCalledWith(tokens.refreshToken);
      expect(result).toEqual({ message: 'Logout berhasil' });
    });

    it('menolak ketika refresh token kosong', async () => {
      await expect(service.logout('')).rejects.toThrow(BadRequestException);
    });
  });
});

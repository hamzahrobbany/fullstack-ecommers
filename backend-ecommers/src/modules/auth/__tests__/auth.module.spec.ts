import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { AuthRepository } from '../auth.repository';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { PasswordUtil } from '../utils/password.util';
import { TokenUtil } from '../utils/token.util';

const TENANT_ID = 'T-01';

describe('AuthService', () => {
  let authService: AuthService;
  let authRepo: jest.Mocked<AuthRepository>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const mockAuthRepo = {
      findUserByEmail: jest.fn(),
      createUser: jest.fn(),
      validateRefreshToken: jest.fn(),
      findUserById: jest.fn(),
      revokeRefreshToken: jest.fn(),
    } as unknown as jest.Mocked<AuthRepository>;

    const mockJwtService = {
      sign: jest.fn().mockReturnValue('mocked-jwt'),
      verify: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: mockAuthRepo },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    authRepo = module.get(AuthRepository);
    jwtService = module.get(JwtService);

    // Mock TokenUtil agar tidak generate token beneran
    jest
      .spyOn(TokenUtil.prototype, 'generateTokenPair')
      .mockResolvedValue({ access_token: 'access', refresh_token: 'refresh' } as any);
  });

  afterEach(() => jest.clearAllMocks());

  // ==============================
  // ✅ validateUser()
  // ==============================
  describe('validateUser', () => {
    it('✅ returns user if credentials valid', async () => {
      const user = { id: 1, email: 'test@test.com', password: 'hashed' };
      authRepo.findUserByEmail.mockResolvedValue(user as any);
      jest
        .spyOn(PasswordUtil, 'comparePassword')
        .mockResolvedValue(true as never);

      const result = await authService.validateUser('test@test.com', 'password');
      expect(result).toBeDefined();
      expect(result!.email).toBe('test@test.com');
    });

    it('❌ returns null if user not found', async () => {
      authRepo.findUserByEmail.mockResolvedValue(null as any);
      const result = await authService.validateUser('missing@test.com', '123');
      expect(result).toBeNull();
    });

    it('❌ returns null if password invalid', async () => {
      const user = { id: 1, email: 'test@test.com', password: 'hashed' };
      authRepo.findUserByEmail.mockResolvedValue(user as any);
      jest
        .spyOn(PasswordUtil, 'comparePassword')
        .mockResolvedValue(false as never);

      const result = await authService.validateUser('test@test.com', 'wrong');
      expect(result).toBeNull();
    });
  });

  // ==============================
  // ✅ login()
  // ==============================
  describe('login', () => {
    it('❌ throws if email not found', async () => {
      authRepo.findUserByEmail.mockResolvedValue(null as any);

      await expect(
        authService.login({ email: 'a@test.com', password: '123' } as any, TENANT_ID),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('❌ throws if password invalid', async () => {
      authRepo.findUserByEmail.mockResolvedValue({
        id: 1,
        email: 'a@test.com',
        password: 'hashed',
        tenantId: TENANT_ID,
      } as any);
      jest
        .spyOn(PasswordUtil, 'comparePassword')
        .mockResolvedValue(false as never);

      await expect(
        authService.login({ email: 'a@test.com', password: 'wrong' } as any, TENANT_ID),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('✅ returns user and tokens when valid', async () => {
      const user = {
        id: 1,
        email: 'a@test.com',
        password: 'hashed',
        role: 'USER',
        tenantId: TENANT_ID,
      };
      authRepo.findUserByEmail.mockResolvedValue(user as any);
      jest
        .spyOn(PasswordUtil, 'comparePassword')
        .mockResolvedValue(true as never);

      const result = await authService.login(
        { email: 'a@test.com', password: 'correct' } as any,
        TENANT_ID,
      );

      expect(result.user.email).toBe('a@test.com');
      expect(result.tokens).toEqual({
        access_token: 'access',
        refresh_token: 'refresh',
      });
    });
  });

  // ==============================
  // ✅ register()
  // ==============================
  describe('register', () => {
    it('❌ throws if email already exists', async () => {
      authRepo.findUserByEmail.mockResolvedValue({ id: 1 } as any);
      await expect(
        authService.register({ email: 'a@test.com', password: '123' } as any, TENANT_ID),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('✅ creates new user and returns tokens', async () => {
      authRepo.findUserByEmail.mockResolvedValue(null as any);
      authRepo.createUser.mockResolvedValue({
        id: 1,
        email: 'a@test.com',
        password: 'hashed',
        role: 'USER',
        tenantId: TENANT_ID,
      } as any);

      jest
        .spyOn(PasswordUtil, 'hashPassword')
        .mockResolvedValue('hashed' as never);

      const result = await authService.register(
        { email: 'a@test.com', password: '123' } as any,
        TENANT_ID,
      );

      expect(result.user.email).toBe('a@test.com');
      expect(result.tokens).toEqual({
        access_token: 'access',
        refresh_token: 'refresh',
      });
    });
  });
});

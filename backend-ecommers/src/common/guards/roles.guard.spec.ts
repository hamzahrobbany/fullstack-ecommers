import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RolesGuard } from './roles.guard';

const createExecutionContext = (userRole?: string): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({
        user: userRole ? { role: userRole } : {},
      }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext);

describe('RolesGuard', () => {
  let reflector: Reflector;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('allows access when no roles metadata is set', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    expect(guard.canActivate(createExecutionContext())).toBe(true);
  });

  it('allows access when user role matches metadata', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['OWNER']);

    expect(guard.canActivate(createExecutionContext('OWNER'))).toBe(true);
  });

  it('throws ForbiddenException when user role is missing', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

    expect(() => guard.canActivate(createExecutionContext())).toThrow(
      ForbiddenException,
    );
  });

  it('throws ForbiddenException when user role does not match', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

    expect(() => guard.canActivate(createExecutionContext('CUSTOMER'))).toThrow(
      ForbiddenException,
    );
  });
});

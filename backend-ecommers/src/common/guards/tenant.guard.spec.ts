import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';

import { TenantGuard } from './tenant.guard';
import type { TenantsService } from '@/modules/tenants/tenants.service';

const createExecutionContext = (
  request: Record<string, any>,
): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext);

describe('TenantGuard', () => {
  const tenantMock = {
    id: 'tenant-123',
    code: 'tenant-code',
    name: 'Tenant Test',
  };

  let tenantsService: jest.Mocked<TenantsService>;
  let guard: TenantGuard;

  beforeEach(() => {
    tenantsService = {
      findById: jest.fn(),
      findByCode: jest.fn(),
      findByDomain: jest.fn(),
    } as unknown as jest.Mocked<TenantsService>;

    guard = new TenantGuard(tenantsService);
  });

  it('returns true when tenantId already exists on request', async () => {
    const ctx = createExecutionContext({ tenantId: 'tenant-123', headers: {} });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(tenantsService.findById).not.toHaveBeenCalled();
  });

  it('resolves tenant from header and attaches to request', async () => {
    tenantsService.findById.mockRejectedValueOnce(new Error('not found'));
    tenantsService.findByCode.mockResolvedValueOnce(tenantMock as any);

    const request: Record<string, any> = {
      headers: { 'x-tenant-id': 'TENANT-CODE' },
    };
    const ctx = createExecutionContext(request);

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(request.tenantId).toBe('tenant-123');
    expect(tenantsService.findByCode).toHaveBeenCalledWith('tenant-code');
  });

  it('throws ForbiddenException when tenant cannot be resolved', async () => {
    tenantsService.findById.mockRejectedValue(new Error('missing'));
    tenantsService.findByCode.mockRejectedValue(new Error('missing'));
    tenantsService.findByDomain.mockRejectedValue(new Error('missing'));

    const ctx = createExecutionContext({ headers: {} });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});

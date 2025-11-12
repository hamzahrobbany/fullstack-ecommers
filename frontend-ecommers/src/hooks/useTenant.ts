'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { tenantCollectionSchema } from '@/lib/zod-schemas';
import { useAuth } from '@/hooks/useAuth';
import type { TenantSummary } from '@/types/tenant';

export function useTenant() {
  const { tenant, switchTenant, isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const response = await api.get('tenants').json<unknown>();
      return tenantCollectionSchema.parse(response);
    },
    enabled: isAuthenticated,
  });

  const tenants = useMemo(() => {
    if (!query.data) {
      return undefined;
    }

    return query.data.map((item) => ({
      id: item.id,
      name: item.name,
      code: item.code,
      domain: item.domain ?? null,
    })) as TenantSummary[];
  }, [query.data]);

  return {
    tenants,
    currentTenant: tenant ?? null,
    switchTenant,
    isLoading: query.isLoading,
    error: query.error,
  };
}

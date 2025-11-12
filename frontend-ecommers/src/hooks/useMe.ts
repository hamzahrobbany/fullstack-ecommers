'use client';

import { useAuth } from '@/hooks/useAuth';

export function useMe() {
  const { user, tenant, isAuthenticated, isLoading } = useAuth();

  return {
    data: user,
    tenant,
    isAuthenticated,
    isLoading,
  };
}

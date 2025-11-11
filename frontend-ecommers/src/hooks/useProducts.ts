'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/kyClient';
import { Product } from '@/lib/schema/product';

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('products').json<{ ok: boolean; data: Product[] }>();
      return res.data;
    },
  });
}

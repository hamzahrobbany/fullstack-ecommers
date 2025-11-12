'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { productCollectionSchema } from '@/lib/zod-schemas';
import { useTenant } from '@/hooks/useTenant';
import type { Product } from '@/types/product';
import { toast } from 'sonner';

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'sample-1',
    tenantId: 'demo',
    name: 'Kopi Susu Gula Aren',
    category: 'Minuman',
    description: 'Signature drink dengan gula aren premium.',
    price: 22000,
    stock: 15,
    image:
      'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'sample-2',
    tenantId: 'demo',
    name: 'Matcha Latte',
    category: 'Minuman',
    description: 'Matcha pilihan dengan susu segar.',
    price: 25000,
    stock: 10,
    image:
      'https://images.unsplash.com/photo-1527169402691-feff5539e52c?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'sample-3',
    tenantId: 'demo',
    name: 'Croissant Almond',
    category: 'Snack',
    description: 'Croissant renyah dengan topping almond.',
    price: 18000,
    stock: 8,
    image:
      'https://images.unsplash.com/photo-1504753793650-d4a2b783c15e?auto=format&fit=crop&w=800&q=80',
  },
];

interface UseProductsOptions {
  tenantId?: string;
  enabled?: boolean;
}

export function useProducts(options?: UseProductsOptions) {
  const { currentTenant } = useTenant();
  const tenantId = options?.tenantId ?? currentTenant?.id ?? null;
  const enabled = Boolean(tenantId) && (options?.enabled ?? true);

  const query = useQuery<Product[]>({
    queryKey: ['products', tenantId],
    queryFn: async () => {
      const response = await api.get('products').json<unknown>();
      const parsed = productCollectionSchema.parse(response);
      return parsed.map((item) => ({
        ...item,
        price: Number(item.price),
        stock: Number(item.stock),
      }));
    },
    enabled,
    staleTime: 1000 * 60,
    retry: 1,
    onError: (error) => {
      console.error('[useProducts] gagal memuat produk:', error);
      toast.error('Gagal memuat data produk');
    },
  });

  const data = useMemo(() => {
    if (enabled) {
      return query.data ?? [];
    }
    return FALLBACK_PRODUCTS;
  }, [enabled, query.data]);

  return {
    ...query,
    data,
    isFallback: !enabled,
  };
}

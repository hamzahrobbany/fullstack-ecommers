"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api-client";
import { productListSchema } from "@/lib/zod-schemas/product";
import type { Product } from "@/types/product";

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: "sample-001",
    tenantId: "demo",
    name: "Kopi Susu Gula Aren",
    category: "Minuman",
    description: "Racikan kopi susu klasik dengan gula aren premium.",
    price: 22000,
    stock: 12,
  },
  {
    id: "sample-002",
    tenantId: "demo",
    name: "Cold Brew Signature",
    category: "Minuman",
    description: "Cold brew 24 jam dengan cita rasa seimbang.",
    price: 27000,
    stock: 8,
  },
  {
    id: "sample-003",
    tenantId: "demo",
    name: "Croissant Butter",
    category: "Snack",
    description: "Croissant renyah dengan butter Prancis pilihan.",
    price: 18000,
    stock: 15,
  },
];

export function useProducts() {
  const [data, setData] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get("products");
        const json = await response.json<unknown>().catch(() => [] as unknown);
        if (!response.ok) {
          const message =
            typeof json === "object" && json && "message" in json
              ? (json as { message?: unknown }).message
              : null;
          throw new Error(
            typeof message === "string" ? message : `Gagal memuat produk (HTTP ${response.status})`,
          );
        }

        const parsed = productListSchema.safeParse(json);
        if (!parsed.success) {
          throw new Error("Format data produk tidak valid.");
        }

        if (active) {
          setData(parsed.data);
          setIsFallback(false);
        }
      } catch (err: unknown) {
        console.warn("[useProducts] gagal memuat data", err);
        if (active) {
          setError(err instanceof Error ? err.message : "Gagal memuat produk.");
          setData(FALLBACK_PRODUCTS);
          setIsFallback(true);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void fetchProducts();

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({ data, isLoading, error, isFallback }),
    [data, isLoading, error, isFallback],
  );

  return value;
}

"use client";

import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useProducts } from "@/hooks/useProducts";

export default function ProductsPage() {
  const { data, isLoading, error, isFallback } = useProducts();

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-neutral-900">Produk</h1>
        <p className="text-sm text-neutral-500">
          {isFallback
            ? "Menampilkan data contoh karena tenant belum dipilih."
            : "Data produk tersinkron dengan backend."}
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.map((product) => (
          <Card key={product.id}>
            <h2 className="text-lg font-semibold text-neutral-900">{product.name}</h2>
            <p className="mt-1 text-sm text-neutral-500">{product.category}</p>
            <p className="mt-4 text-sm text-neutral-600">{product.description}</p>
            <p className="mt-6 text-base font-semibold text-neutral-900">
              Rp{product.price.toLocaleString("id-ID")}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}

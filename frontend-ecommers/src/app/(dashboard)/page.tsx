import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function DashboardHomePage() {
  return (
    <ProtectedRoute>
      <section className="space-y-6">
        <h1 className="text-3xl font-bold text-neutral-900">Ringkasan Tenant</h1>
        <p className="text-neutral-600">
          Pantau performa tenant Anda, lihat penjualan terbaru, dan lakukan tindakan cepat dari satu tempat.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <p className="text-sm text-neutral-500">Total Produk</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">24</p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <p className="text-sm text-neutral-500">Pesanan Aktif</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">12</p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <p className="text-sm text-neutral-500">Pendapatan Bulan Ini</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">Rp12.500.000</p>
          </div>
        </div>
      </section>
    </ProtectedRoute>
  );
}

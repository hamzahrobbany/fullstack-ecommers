const orders = [
  { id: "INV-001", customer: "Ayu Lestari", total: 320000, status: "Diproses" },
  { id: "INV-002", customer: "Bagus Setiawan", total: 185000, status: "Selesai" },
  { id: "INV-003", customer: "Chandra Wijaya", total: 72000, status: "Menunggu" },
];

export default function OrdersPage() {
  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-neutral-900">Pesanan</h1>
        <p className="text-sm text-neutral-500">
          Data pesanan terbaru tenant Anda. Integrasikan dengan backend untuk menampilkan data
          real-time.
        </p>
      </header>
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-neutral-600">Invoice</th>
              <th className="px-4 py-3 font-semibold text-neutral-600">Pelanggan</th>
              <th className="px-4 py-3 font-semibold text-neutral-600">Total</th>
              <th className="px-4 py-3 font-semibold text-neutral-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-4 py-3 font-medium text-neutral-900">{order.id}</td>
                <td className="px-4 py-3 text-neutral-600">{order.customer}</td>
                <td className="px-4 py-3 text-neutral-600">
                  Rp{order.total.toLocaleString("id-ID")}
                </td>
                <td className="px-4 py-3 text-neutral-600">{order.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

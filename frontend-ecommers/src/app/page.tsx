export default function HomePage() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center gap-6 px-6 py-16 text-center">
      <h1 className="text-4xl font-bold text-neutral-900 sm:text-5xl">
        Platform E-Commerce Multi-Tenant
      </h1>
      <p className="text-lg text-neutral-600">
        Kelola tenant, produk, dan pesanan Anda melalui dashboard yang aman serta storefront
        yang responsif. Masuk untuk memulai atau jelajahi produk kami.
      </p>
      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a
          href="/login"
          className="rounded-md bg-blue-600 px-6 py-3 font-semibold text-white shadow hover:bg-blue-700"
        >
          Masuk ke Dashboard
        </a>
        <a
          href="/products"
          className="rounded-md border border-neutral-300 px-6 py-3 font-semibold text-neutral-700 hover:border-neutral-400"
        >
          Lihat Produk
        </a>
      </div>
    </section>
  );
}

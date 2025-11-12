"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/components/AuthProvider";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/products", label: "Produk" },
  { href: "/orders", label: "Pesanan" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, handleLogout } = useAuth();

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-neutral-100">
        <aside className="hidden w-64 flex-col border-r border-neutral-200 bg-white p-6 lg:flex">
          <div className="mb-10">
            <h2 className="text-xl font-semibold text-neutral-900">Dashboard</h2>
            <p className="text-sm text-neutral-500">Kelola operasi tenant Anda</p>
          </div>
          <nav className="flex flex-1 flex-col gap-2">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <button
            onClick={handleLogout}
            className="mt-8 rounded-md border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
          >
            Keluar
          </button>
        </aside>
        <main className="flex-1">
          <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500">Tenant Aktif</p>
              <p className="text-base font-semibold text-neutral-900">{user?.tenantId ?? "-"}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-neutral-900">{user?.name ?? "Pengguna"}</p>
              <p className="text-xs text-neutral-500">{user?.email}</p>
            </div>
          </header>
          <div className="px-6 py-8">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

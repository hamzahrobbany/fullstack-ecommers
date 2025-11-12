import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "Kopiq E-Commerce",
  description: "Multi-tenant e-commerce dashboard and storefront.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-neutral-50 text-neutral-900">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

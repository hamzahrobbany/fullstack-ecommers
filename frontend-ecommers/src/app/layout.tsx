import './globals.css';
import AppProviders from '@/providers/AppProviders';
import Header from '@/components/Header';
import { Layout } from 'antd';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'frontend-ecommers',
  description: 'E-commers frontend with Next.js + Ant Design + React Query + Zod',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body suppressHydrationWarning>
        <AppProviders>
          <Layout style={{ minHeight: '100vh' }}>
            <Header />

            {/* gunakan main biasa agar SSR stabil */}
            <main
              style={{
                padding: 24,
                maxWidth: 1200,
                margin: '0 auto',
                width: '100%',
              }}
            >
              {children}
            </main>

            <footer style={{ textAlign: 'center', padding: 16, color: '#888' }}>
              © {new Date().getFullYear()} frontend-ecommers
            </footer>
          </Layout>
        </AppProviders>
      </body>
    </html>
  );
}

'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from 'sonner';
import { ConfigProvider, App as AntApp } from 'antd';
import AntdRegistry from '@/components/AntdRegistry';
import React from 'react';
import AuthProvider from '@/components/AuthProvider';

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider
        theme={{
          token: { colorPrimary: '#1677ff', borderRadius: 10 },
        }}
      >
        <AntApp>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              {children}
              <Toaster richColors position="top-right" />
            </AuthProvider>
          </QueryClientProvider>
        </AntApp>
      </ConfigProvider>
    </AntdRegistry>
  );
}

'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter, useSelectedLayoutSegments } from 'next/navigation';
import { Layout, Menu, Spin, Typography } from 'antd';
import {
  AppstoreOutlined,
  BarcodeOutlined,
  LogoutOutlined,
  ShoppingOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import TenantSwitcher from '@/components/TenantSwitcher';

const { Header, Sider, Content } = Layout;

interface ProtectedLayoutProps {
  children: React.ReactNode;
  activeKey?: string;
}

export default function ProtectedLayout({ children, activeKey }: ProtectedLayoutProps) {
  const router = useRouter();
  const segments = useSelectedLayoutSegments();
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const derivedActiveKey = useMemo(() => {
    if (activeKey) return activeKey;
    if (!segments.length) return 'overview';
    const [segment] = segments;
    if (segment === 'products' || segment === 'orders' || segment === 'tenants') {
      return segment;
    }
    return 'overview';
  }, [activeKey, segments]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const pageTitle =
    derivedActiveKey === 'products'
      ? 'Kelola Produk'
      : derivedActiveKey === 'orders'
      ? 'Pesanan'
      : derivedActiveKey === 'tenants'
      ? 'Tenant'
      : 'Ringkasan';

  return (
    <Layout hasSider>
      <Sider breakpoint="lg" collapsedWidth="0" width={240} style={{ minHeight: '100vh' }}>
        <div style={{ padding: 16 }}>
          <Typography.Title level={4} style={{ color: 'white', marginBottom: 0 }}>
            Dashboard
          </Typography.Title>
          <Typography.Text style={{ color: 'rgba(255,255,255,0.65)' }}>
            {user?.name}
          </Typography.Text>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[derivedActiveKey]}
          items={[
            {
              key: 'overview',
              icon: <AppstoreOutlined />,
              label: <Link href="/dashboard">Ringkasan</Link>,
            },
            {
              key: 'products',
              icon: <ShoppingOutlined />,
              label: <Link href="/dashboard/products">Produk</Link>,
            },
            {
              key: 'orders',
              icon: <BarcodeOutlined />,
              label: <Link href="/dashboard/orders">Pesanan</Link>,
            },
            {
              key: 'tenants',
              icon: <TeamOutlined />,
              label: <Link href="/dashboard/tenants">Tenant</Link>,
            },
            {
              type: 'divider',
            },
            {
              key: 'logout',
              icon: <LogoutOutlined />,
              label: 'Keluar',
              onClick: () => logout(),
            },
          ]}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingInline: 24,
            gap: 16,
          }}
        >
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {pageTitle}
            </Typography.Title>
            <Typography.Text type="secondary">Kelola operasional tenant Anda</Typography.Text>
          </div>
          <TenantSwitcher />
        </Header>
        <Content style={{ padding: 24, minHeight: '100vh', background: '#f5f5f5' }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 12, minHeight: 'calc(100vh - 200px)' }}>
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

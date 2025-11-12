'use client';

import { Layout, Menu, Typography } from 'antd';
import {
  CoffeeOutlined,
  StarOutlined,
  ShoppingCartOutlined,
  DashboardOutlined,
  LoginOutlined,
} from '@ant-design/icons';
import Link from 'next/link';

const { Header: AntHeader } = Layout;

export default function Header() {
  return (
    <AntHeader style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <Typography.Title level={4} style={{ color: 'white', margin: 0 }}>
        ☕ frontend-ecommers
      </Typography.Title>
      <Menu
        theme="dark"
        mode="horizontal"
        selectable={false}
        items={[
          { key: 'home', icon: <CoffeeOutlined />, label: <Link href="/">Home</Link> },
          { key: 'hot', icon: <StarOutlined />, label: <Link href="/hot">Hot</Link> },
          { key: 'cart', icon: <ShoppingCartOutlined />, label: <Link href="/cart">Cart</Link> },
          {
            key: 'dashboard',
            icon: <DashboardOutlined />,
            label: <Link href="/dashboard">Dashboard</Link>,
          },
          {
            key: 'login',
            icon: <LoginOutlined />,
            label: <Link href="/(auth)/login">Masuk</Link>,
          },
        ]}
        style={{ marginLeft: 24, flex: 1, minWidth: 0 }}
      />
    </AntHeader>
  );
}

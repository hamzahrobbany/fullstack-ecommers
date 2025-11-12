'use client';

import { useEffect, useState } from 'react';
import { Button, Card, Form, Input, Typography } from 'antd';
import { LockOutlined, MailOutlined, ShopOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface LoginFormValues {
  email: string;
  password: string;
  tenantCode: string;
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleFinish = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      await login(values);
      router.replace('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return null;
  }

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <Card style={{ width: 420 }}>
        <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 32 }}>
          Masuk ke Dashboard
        </Typography.Title>
        <Form layout="vertical" onFinish={handleFinish} requiredMark={false}>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, message: 'Email wajib diisi' }]}
          >
            <Input prefix={<MailOutlined />} placeholder="john@contoh.com" type="email" />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Password wajib diisi' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="••••••" />
          </Form.Item>
          <Form.Item
            label="Kode Tenant"
            name="tenantCode"
            rules={[{ required: true, message: 'Kode tenant wajib diisi' }]}
          >
            <Input prefix={<ShopOutlined />} placeholder="contoh: kopiku" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Masuk
          </Button>
        </Form>
      </Card>
    </div>
  );
}

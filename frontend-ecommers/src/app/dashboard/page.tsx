'use client';

import { Card, Col, List, Row, Statistic, Typography } from 'antd';
import { ShoppingOutlined, UserOutlined, StockOutlined } from '@ant-design/icons';
import { useProducts } from '@/hooks/useProducts';
import { useTenant } from '@/hooks/useTenant';
import { useMe } from '@/hooks/useMe';
import { formatCurrency, formatDateTime } from '@/lib/helpers';

export default function DashboardOverviewPage() {
  const { data: products, isFallback } = useProducts();
  const { tenants, currentTenant } = useTenant();
  const { data: user } = useMe();

  const totalProducts = products?.length ?? 0;
  const totalStock = products?.reduce((acc, product) => acc + (product.stock ?? 0), 0) ?? 0;
  const latestProducts = products?.slice(0, 5) ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Typography.Title level={3} style={{ marginBottom: 4 }}>
          Halo, {user?.name ?? 'Merchant'} 👋
        </Typography.Title>
        <Typography.Text type="secondary">
          {isFallback
            ? 'Menampilkan data contoh. Silakan login untuk melihat data tenant Anda.'
            : `Anda sedang mengelola tenant ${currentTenant?.name ?? '-'}.`}
        </Typography.Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Total Produk"
              value={totalProducts}
              prefix={<ShoppingOutlined style={{ color: '#1677ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Total Stok"
              value={totalStock}
              prefix={<StockOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Jumlah Tenant"
              value={tenants?.length ?? 0}
              prefix={<UserOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Produk Terbaru" bordered={false}>
        <List
          dataSource={latestProducts}
          locale={{ emptyText: 'Belum ada produk' }}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={item.name}
                description={
                  <>
                    <Typography.Text strong>{formatCurrency(item.price)}</Typography.Text>
                    <Typography.Text type="secondary" style={{ marginLeft: 12 }}>
                      Stok: {item.stock}
                    </Typography.Text>
                  </>
                }
              />
              {item.updatedAt && (
                <Typography.Text type="secondary">
                  Diperbarui {formatDateTime(item.updatedAt)}
                </Typography.Text>
              )}
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}

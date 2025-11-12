'use client';

import Image from 'next/image';
import { Card, Button, Rate, Row, Col, Typography, Skeleton, Alert } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { useProducts } from '@/hooks/useProducts';
import { toast } from 'sonner';
import type { Product } from '@/lib/schema/product';
import { formatCurrency } from '@/lib/helpers';

export default function HomePage() {
  const { data: products, isLoading, isFallback } = useProducts();

  const renderCard = (p: Product) => (
    <Col xs={24} sm={12} md={8} key={p.id}>
      <Card
        hoverable
        cover={
          <Image
            src={p.image}
            alt={p.name}
            width={400}
            height={180}
            style={{ objectFit: 'cover', width: '100%', height: '180px' }}
            priority
          />
        }
      >
        <Typography.Text type="secondary">{p.category}</Typography.Text>
        <Typography.Title level={4}>{p.name}</Typography.Title>
        <Rate disabled allowHalf defaultValue={4.5} />
        <Typography.Title level={5}>{formatCurrency(p.price)}</Typography.Title>
        <Button
          type="primary"
          icon={<ShoppingCartOutlined />}
          onClick={() => toast.success(`Ditambahkan: ${p.name}`)}
          block
        >
          Tambah ke Keranjang
        </Button>
      </Card>
    </Col>
  );

  return (
    <>
      <Typography.Title level={2}>Daftar Produk</Typography.Title>

      {isFallback && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Menampilkan produk contoh"
          description="Masuk ke dashboard untuk melihat dan mengelola produk tenant Anda."
        />
      )}

      <Row gutter={[16, 16]}>
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Col xs={24} sm={12} md={8} key={i}>
                <Card>
                  <Skeleton.Image active style={{ width: '100%', height: 180 }} />
                  <Skeleton active paragraph={{ rows: 3 }} />
                </Card>
              </Col>
            ))
          : products?.map(renderCard)}
      </Row>
    </>
  );
}

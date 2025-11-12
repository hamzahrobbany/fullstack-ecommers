'use client';

import { useMemo } from 'react';
import { Card, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Order } from '@/types/order';
import { formatCurrency, formatDateTime } from '@/lib/helpers';

const STATUS_COLORS: Record<Order['status'], string> = {
  PENDING: 'gold',
  PAID: 'green',
  SHIPPED: 'blue',
  CANCELLED: 'red',
};

export default function OrdersPage() {
  const data = useMemo<Order[]>(
    () => [
      {
        id: 'order-1',
        orderNumber: 'INV-20240101',
        customerName: 'Andi Wijaya',
        totalAmount: 180000,
        status: 'PAID',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'order-2',
        orderNumber: 'INV-20240102',
        customerName: 'Siti Rahma',
        totalAmount: 245000,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'order-3',
        orderNumber: 'INV-20240103',
        customerName: 'Budi Santoso',
        totalAmount: 99000,
        status: 'SHIPPED',
        createdAt: new Date().toISOString(),
      },
    ],
    [],
  );

  const columns: ColumnsType<Order> = [
    {
      title: 'Nomor Pesanan',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
    },
    {
      title: 'Pelanggan',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (value: number) => formatCurrency(value),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (value: Order['status']) => <Tag color={STATUS_COLORS[value]}>{value}</Tag>,
    },
    {
      title: 'Tanggal',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value: string) => formatDateTime(value),
    },
  ];

  return (
    <Card title="Riwayat Pesanan" bordered={false}>
      <Typography.Paragraph type="secondary">
        Integrasi API pesanan belum tersedia, menampilkan data contoh untuk desain UI.
      </Typography.Paragraph>
      <Table<Order>
        dataSource={data}
        columns={columns}
        pagination={{ pageSize: 5 }}
        rowKey={(record) => record.id}
      />
    </Card>
  );
}

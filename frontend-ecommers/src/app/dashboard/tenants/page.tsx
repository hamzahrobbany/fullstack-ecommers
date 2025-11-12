'use client';

import { Card, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTenant } from '@/hooks/useTenant';
import type { TenantSummary } from '@/types/tenant';

export default function TenantsPage() {
  const { tenants, isLoading } = useTenant();

  const columns: ColumnsType<TenantSummary> = [
    {
      title: 'Nama Tenant',
      dataIndex: 'name',
      key: 'name',
      render: (value: string, record) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Typography.Text strong>{value}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {record.code}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: 'Domain',
      dataIndex: 'domain',
      key: 'domain',
      render: (value: string | null | undefined) =>
        value ? <Tag color="blue">{value}</Tag> : <Tag color="default">-</Tag>,
    },
  ];

  return (
    <Card title="Daftar Tenant" bordered={false}>
      <Typography.Paragraph type="secondary">
        Anda dapat mengelola beberapa tenant sekaligus. Pilih tenant aktif melalui dropdown di header.
      </Typography.Paragraph>
      <Table<TenantSummary>
        dataSource={tenants}
        columns={columns}
        loading={isLoading}
        rowKey={(record) => record.id}
        pagination={false}
        locale={{ emptyText: 'Belum ada tenant' }}
      />
    </Card>
  );
}

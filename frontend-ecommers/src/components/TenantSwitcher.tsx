'use client';

import React from 'react';
import { Select, Typography } from 'antd';
import { useTenant } from '@/hooks/useTenant';

export default function TenantSwitcher() {
  const { tenants, currentTenant, switchTenant, isLoading } = useTenant();

  const options = tenants?.map((tenant) => ({
    label: tenant.name,
    value: tenant.id,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        Tenant aktif
      </Typography.Text>
      <Select
        placeholder="Pilih tenant"
        style={{ minWidth: 220 }}
        options={options}
        loading={isLoading}
        value={currentTenant?.id}
        onChange={(value) => {
          const tenant = tenants?.find((item) => item.id === value);
          if (tenant) {
            switchTenant(tenant);
          }
        }}
        showSearch
        optionFilterProp="label"
      />
    </div>
  );
}

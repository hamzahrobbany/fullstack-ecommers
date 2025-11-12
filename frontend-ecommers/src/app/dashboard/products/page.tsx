'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useProducts } from '@/hooks/useProducts';
import { productFormSchema } from '@/lib/zod-schemas';
import type { Product, ProductFormValues } from '@/types/product';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/helpers';

interface DrawerState {
  open: boolean;
  product: Product | null;
}

const initialDrawerState: DrawerState = {
  open: false,
  product: null,
};

export default function ProductsPage() {
  const { data: products, isLoading, isFallback } = useProducts();
  const [drawerState, setDrawerState] = useState<DrawerState>(initialDrawerState);
  const [form] = Form.useForm<ProductFormValues>();
  const queryClient = useQueryClient();

  const openCreateDrawer = useCallback(() => {
    setDrawerState({ open: true, product: null });
    form.resetFields();
  }, [form]);

  const openEditDrawer = useCallback(
    (product: Product) => {
      if (isFallback) return;
      setDrawerState({ open: true, product });
      form.setFieldsValue({
        name: product.name,
        category: product.category,
        description: product.description ?? undefined,
        price: product.price,
        stock: product.stock,
        image: product.image ?? undefined,
      });
    },
    [form, isFallback],
  );

  const closeDrawer = useCallback(() => {
    setDrawerState(initialDrawerState);
    form.resetFields();
  }, [form]);

  const createMutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const payload = productFormSchema.parse(values);
      const response = await api.post('products', { json: payload }).json<Product>();
      return response;
    },
    onSuccess: () => {
      toast.success('Produk berhasil ditambahkan');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      closeDrawer();
    },
    onError: (error) => {
      console.error('[ProductsPage] gagal membuat produk:', error);
      toast.error('Gagal menyimpan produk');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: ProductFormValues }) => {
      const payload = productFormSchema.parse(values);
      const response = await api.put(`products/${id}`, { json: payload }).json<Product>();
      return response;
    },
    onSuccess: () => {
      toast.success('Produk berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      closeDrawer();
    },
    onError: (error) => {
      console.error('[ProductsPage] gagal memperbarui produk:', error);
      toast.error('Gagal memperbarui produk');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`products/${id}`);
      return id;
    },
    onSuccess: () => {
      toast.success('Produk dihapus');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error) => {
      console.error('[ProductsPage] gagal menghapus produk:', error);
      toast.error('Gagal menghapus produk');
    },
  });

  const handleSubmit = async (values: ProductFormValues) => {
    if (drawerState.product) {
      await updateMutation.mutateAsync({ id: drawerState.product.id, values });
    } else {
      await createMutation.mutateAsync(values);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: 'Nama Produk',
        dataIndex: 'name',
        key: 'name',
        render: (value: string, record: Product) => (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Typography.Text strong>{value}</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {record.category}
            </Typography.Text>
          </div>
        ),
      },
      {
        title: 'Harga',
        dataIndex: 'price',
        key: 'price',
        render: (value: number) => formatCurrency(value),
      },
      {
        title: 'Stok',
        dataIndex: 'stock',
        key: 'stock',
        render: (value: number) => (
          <Tag color={value > 0 ? 'blue' : 'red'}>{value} pcs</Tag>
        ),
      },
      {
        title: 'Aksi',
        key: 'actions',
        render: (_: unknown, record: Product) => (
          <Space>
            <Button type="link" onClick={() => openEditDrawer(record)} disabled={isFallback}>
              Edit
            </Button>
            <Button
              danger
              type="link"
              disabled={isFallback}
              onClick={() => {
                Modal.confirm({
                  title: 'Hapus produk?',
                  content: `Anda yakin ingin menghapus ${record.name}?`,
                  okText: 'Hapus',
                  cancelText: 'Batal',
                  onOk: () => deleteMutation.mutate(record.id),
                  okButtonProps: { danger: true },
                });
              }}
              loading={deleteMutation.isPending}
            >
              Hapus
            </Button>
          </Space>
        ),
      },
    ],
    [deleteMutation, openEditDrawer, isFallback],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            Daftar Produk
          </Typography.Title>
          <Typography.Text type="secondary">
            {isFallback
              ? 'Menampilkan data contoh, login untuk mengelola produk tenant.'
              : 'Tambah, ubah, atau hapus produk tenant Anda.'}
          </Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateDrawer} disabled={isFallback}>
          Tambah Produk
        </Button>
      </div>

      <Table<Product>
        dataSource={products}
        columns={columns}
        loading={isLoading}
        rowKey={(record) => record.id}
        pagination={{ pageSize: 8 }}
      />

      <Drawer
        title={drawerState.product ? 'Edit Produk' : 'Tambah Produk'}
        width={420}
        onClose={closeDrawer}
        open={drawerState.open}
        destroyOnClose
        footer={
          <Space style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <Button onClick={closeDrawer}>Batal</Button>
            <Button
              type="primary"
              onClick={() => form.submit()}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              Simpan
            </Button>
          </Space>
        }
      >
        <Form<ProductFormValues>
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ stock: 0 }}
        >
          <Form.Item
            label="Nama Produk"
            name="name"
            rules={[{ required: true, message: 'Nama produk wajib diisi' }]}
          >
            <Input placeholder="Contoh: Kopi Susu" />
          </Form.Item>
          <Form.Item
            label="Kategori"
            name="category"
            rules={[{ required: true, message: 'Kategori wajib diisi' }]}
          >
            <Input placeholder="Contoh: Minuman" />
          </Form.Item>
          <Form.Item label="Deskripsi" name="description">
            <Input.TextArea rows={3} placeholder="Tuliskan deskripsi singkat" />
          </Form.Item>
          <Form.Item
            label="Harga"
            name="price"
            rules={[{ required: true, message: 'Harga wajib diisi' }]}
          >
            <InputNumber
              min={0}
              prefix="Rp"
              style={{ width: '100%' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
              parser={(value) => (value ? value.replace(/\./g, '') : '')}
            />
          </Form.Item>
          <Form.Item
            label="Stok"
            name="stock"
            rules={[{ required: true, message: 'Stok wajib diisi' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="URL Gambar" name="image">
            <Input placeholder="https://..." />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}

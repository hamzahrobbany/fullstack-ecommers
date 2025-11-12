import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  tenantCode: z
    .string()
    .min(3, 'Kode tenant minimal 3 karakter')
    .optional(),
});

export const tenantSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  code: z.string(),
  domain: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const tenantCollectionSchema = z.array(tenantSchema);

export const productSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string(),
  category: z.string(),
  description: z.string().nullable().optional(),
  price: z.coerce.number(),
  stock: z.coerce.number(),
  image: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const productCollectionSchema = z.array(productSchema);

export const productFormSchema = z.object({
  name: z.string().min(2, 'Nama produk wajib diisi'),
  category: z.string().min(2, 'Kategori wajib diisi'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Harga tidak boleh negatif'),
  stock: z.coerce.number().min(0, 'Stok minimal 0'),
  image: z.string().url('Gunakan URL gambar yang valid').optional().or(z.literal('')).transform((val) => val || undefined),
});

export const authResponseSchema = z.object({
  tenant: tenantSchema.pick({ id: true, name: true, code: true, domain: true }),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    role: z.string(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  }),
  tokens: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
  }),
});

export type LoginSchema = z.infer<typeof loginSchema>;
export type ProductSchema = z.infer<typeof productSchema>;
export type ProductFormSchema = z.infer<typeof productFormSchema>;

import { z } from 'zod';

export const productSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(2, 'Nama produk wajib diisi'),
  description: z.string().min(5, 'Deskripsi terlalu pendek'),
  price: z.number().min(1000, 'Harga minimal 1000'),
  category: z.string(),
  stock: z.number().min(0),
  image: z.string().url('URL gambar tidak valid'),
});

export type Product = z.infer<typeof productSchema>;

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  category: string;
  description?: string | null;
  price: number;
  stock: number;
  image?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type ProductFormValues = Pick<
  Product,
  'name' | 'category' | 'description' | 'price' | 'stock' | 'image'
>;

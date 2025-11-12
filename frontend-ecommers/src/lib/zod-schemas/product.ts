import { z } from "zod";

export const productSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  category: z.string(),
  description: z.string().optional(),
  price: z.number(),
  stock: z.number().optional(),
});

export const productListSchema = z.array(productSchema);

export type ProductSchema = z.infer<typeof productSchema>;

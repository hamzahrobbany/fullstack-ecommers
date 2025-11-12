import { z } from 'zod';
import { productSchema as sharedProductSchema } from '@/lib/zod-schemas';

export const productSchema = sharedProductSchema;

export type Product = z.infer<typeof productSchema>;

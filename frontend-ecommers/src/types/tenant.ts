export interface Tenant {
  id: string;
  name: string;
  code: string;
  domain?: string | null;
  description?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type TenantSummary = Pick<Tenant, 'id' | 'name' | 'code'> & {
  domain?: string | null;
};

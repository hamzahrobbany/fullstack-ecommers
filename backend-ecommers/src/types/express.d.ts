declare global {
  namespace Express {
    export interface Request {
      tenant?: {
        id: string;
        name?: string | null;
        domain?: string | null;
        code?: string | null;
        [key: string]: any;
      } | null;
      tenantId?: string | null;
    }
  }
}

export {};

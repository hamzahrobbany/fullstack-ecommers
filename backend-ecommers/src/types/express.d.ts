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
      tenantSource?: string | null;
      tenantHostname?: string | null;
      tenantSubdomain?: string | null;
      debugJwtPayload?: any;
    }
  }
}

export {};

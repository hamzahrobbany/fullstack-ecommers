export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  tenantId: string;
  tenantCode: string;
  iat?: number;
  exp?: number;
}

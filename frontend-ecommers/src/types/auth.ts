export type UserRole = 'OWNER' | 'ADMIN' | 'STAFF' | 'CUSTOMER';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthTenant {
  id: string;
  name: string;
  code: string;
  domain?: string | null;
}

export interface AuthResponse {
  tenant: AuthTenant;
  user: AuthUser;
  tokens: AuthTokens;
}

export interface LoginPayload {
  email: string;
  password: string;
  tenantCode: string;
}

export interface AuthState {
  user: AuthUser | null;
  tenant: AuthTenant | null;
  tokens: AuthTokens | null;
}

export interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  switchTenant: (tenant: AuthTenant) => Promise<void>;
}

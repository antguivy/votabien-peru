export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in?: number;
}
export type UserRole = "user" | "editor" | "admin" | "super_admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  image?: string;
}

export interface VerifyAccountData {
  email: string;
  token: string;
}

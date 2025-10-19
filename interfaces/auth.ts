export interface LoginCredentials {
    email: string;
    password: string
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

export interface User {
    id: string;
    name?: string;
    email: string;
    email_verified: string;
    is_admin: boolean;
    image?: string;
    created_at: string;
    updated_at?: string;
}

export interface VerifyAccountData {
    email: string;
    token: string;
}

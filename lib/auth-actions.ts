"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { API_BASE_URL } from "./config";
import {
  AuthTokens,
  LoginCredentials,
  RegisterData,
  User,
} from "@/interfaces/auth";

const getCookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const, // ✅ Cambiado de 'strict' a 'lax'
  maxAge,
  path: "/",
});

function decodeJwtPayload(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Token inválido (no es un JWT)");
  }

  let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");

  // padding
  while (base64.length % 4) {
    base64 += "=";
  }

  const decoded = Buffer.from(base64, "base64").toString("utf-8");
  return JSON.parse(decoded);
}

export async function serverLogin(credentials: LoginCredentials) {
  try {
    const formData = new FormData();
    formData.append("username", credentials.email);
    formData.append("password", credentials.password);

    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.detail || "Login failed" };
    }

    const tokens: AuthTokens = data;
    const cookieStore = await cookies();

    cookieStore.set(
      "access_token",
      tokens.access_token,
      getCookieOptions(tokens.expires_in || 1800)
    );

    if (tokens.refresh_token) {
      cookieStore.set(
        "refresh_token",
        tokens.refresh_token,
        getCookieOptions(30 * 24 * 60 * 60)
      );
    }

    return { success: true, tokens };
  } catch (error) {
    console.error("Network error login", error);
    return {
      error: error instanceof Error ? error.message : "Network error occurred",
    };
  }
}

export async function serverRegister(data: RegisterData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error("Error en registro:", error);
      return { error: error.detail || "Registration failed" };
    }

    const user: User = await response.json();
    return { success: true, user };
  } catch (error) {
    console.error("Network error en registro:", error);
    return {
      error: error instanceof Error ? error.message : "Network error occurred",
    };
  }
}

export async function serverGetUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { error: "No token found" };
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store", // ✅ Importante: no cachear datos del usuario
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { error: "Unauthorized" };
      }
      const error = await response.json().catch(() => ({}));
      return { error: error.detail || "Failed to get user" };
    }

    const user: User = await response.json();
    return { success: true, user };
  } catch (error) {
    console.error("Error obteniendo usuario:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to get user",
    };
  }
}

export async function serverLogout() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/v1/users/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error("Backend logout failed:", error);
      }
    }

    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");
  } catch (error) {
    console.error("Logout error:", error);
  }

  redirect("/auth/login");
}

export async function serverVerifyAccount(email: string, token: string) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/auth/new-verification`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, token }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { error: error.detail || "Account verification failed" };
    }

    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Network error occurred",
    };
  }
}

// ✅ NUEVA: Action para obtener info del token (exp, iat)
export async function serverGetTokenInfo() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { error: "No token found" };
    }

    const payload = decodeJwtPayload(token);
    const now = Math.floor(Date.now() / 1000);

    return {
      exp: payload.exp,
      iat: payload.iat,
      timeUntilExpiry: payload.exp - now,
      isExpired: now >= payload.exp,
    };
  } catch (error) {
    console.error("Error obteniendo token:", error);
    return {
      error: error instanceof Error ? error.message : "Invalid token ",
    };
  }
}

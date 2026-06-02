"use server";

import { redirect } from "next/navigation";
import { auth } from "./auth";
import { headers } from "next/headers";
import prisma from "./prisma";
import { UserRole, UserProfile } from "@/interfaces/user";

// ============================================
// TIPOS
// ============================================

type GetUserResponse = {
  user: UserProfile | null;
  error?: string | null;
};

type AuthActionResponse = {
  error?: string;
  success?: boolean;
};

// ============================================
// OBTENER USUARIO
// ============================================

export async function serverGetUser(): Promise<GetUserResponse> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return {
        user: null,
        error: "No session",
      };
    }

    const { user } = session;
    // Better Auth User doesn't have role by default unless we add it, but since we are using the profiles table logic or extending User, let's assume we fetch from Prisma.
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return { user: null, error: "User not found in DB" };
    }

    const profile: UserProfile = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: (dbUser.role as UserRole) || "user",
      image: dbUser.image,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt,
    };
    return { user: profile, error: null };
  } catch (error) {
    console.error("Unexpected error in serverGetUser:", error);
    return { user: null, error: "Internal Error" };
  }
}

// ============================================
// LOGOUT
// ============================================
export async function serverLogout() {
  redirect("/auth/login");
}

// ============================================
// VERIFICAR ROL (Utility)
// ============================================
export async function serverCheckRole(allowedRoles: UserRole[]) {
  const { user } = await serverGetUser();

  if (!user) {
    redirect("/auth/login");
  }

  if (!allowedRoles.includes(user.role)) {
    redirect("/unauthorized");
  }

  return { user };
}

// ============================================
// VERIFICAR SI ES ADMIN (Utility)
// ============================================
export async function serverRequireAdmin() {
  return serverCheckRole(["admin"]);
}

// ============================================
// VERIFICAR SI ES EDITOR O ADMIN (Utility)
// ============================================
export async function serverRequireEditor() {
  return serverCheckRole(["editor", "admin"]);
}

// ============================================
// ACTUALIZAR ROL (Solo para admins)
// ============================================
export async function serverUpdateUserRole(
  userId: string,
  newRole: UserRole,
): Promise<AuthActionResponse> {
  const { user: currentUserProfile } = await serverGetUser();

  if (!currentUserProfile || currentUserProfile.role !== "admin") {
    return { error: "No tienes permisos para realizar esta acción" };
  }

  if (userId === currentUserProfile.id && newRole !== "admin") {
    return { error: "No puedes cambiar tu propio rol de administrador" };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Algo salió mal" };
  }
}

// ============================================
// ACTUALIZAR PERFIL (Datos propios)
// ============================================
export async function serverUpdateProfile(
  updates: Partial<Pick<UserProfile, "name" | "image">>,
): Promise<AuthActionResponse> {
  const { user } = await serverGetUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: updates.name,
        image: updates.image,
      },
    });
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Algo salió mal" };
  }
}

// ============================================
// OBTENER TODOS LOS USUARIOS (Solo para admins)
// ============================================
export async function serverGetAllUsers() {
  await serverRequireAdmin();

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { profiles: users, error: null };
  } catch (error) {
    console.error("Error fetching users:", error);
    return {
      profiles: [],
      error: error instanceof Error ? error.message : "Algo salió mal",
    };
  }
}

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createId } from "@paralleldrive/cuid2";
import { hashPassword } from "better-auth/crypto";
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
    redirect("/admin/unauthorized");
  }

  return { user };
}

// ============================================
// VERIFICAR SI ES ADMIN (Utility)
// super_admin es un alias operativo del admin
// ============================================
export async function serverRequireAdmin() {
  return serverCheckRole(["admin", "super_admin"]);
}

// ============================================
// VERIFICAR SI ES EDITOR O ADMIN (Utility)
// NOTA: desde la incorporación de voluntarios, "editor" tiene permisos de
// voluntario (revisar hallazgos + trivia). Las mutaciones de gestión
// (personas, partidos, research, eliminaciones) quedan reservadas a admin.
// ============================================
export async function serverRequireEditor() {
  return serverCheckRole(["admin", "super_admin"]);
}

// ============================================
// VERIFICAR SI ES VOLUNTARIO, EDITOR O ADMIN (Revisores)
// ============================================
export async function serverRequireReviewer() {
  return serverCheckRole(["volunteer", "editor", "admin", "super_admin"]);
}

// ============================================
// VERIFICAR ROL SIN REDIRIGIR (para UI condicional)
// ============================================
export async function serverHasAnyRole(allowedRoles: UserRole[]) {
  const { user } = await serverGetUser();
  return !!user && allowedRoles.includes(user.role);
}

// ============================================
// ACTUALIZAR ROL (Solo para admins)
// ============================================
export async function serverUpdateUserRole(
  userId: string,
  newRole: UserRole,
): Promise<AuthActionResponse> {
  const { user: currentUserProfile } = await serverGetUser();

  if (
    !currentUserProfile ||
    !["admin", "super_admin"].includes(currentUserProfile.role)
  ) {
    return { error: "No tienes permisos para realizar esta acción" };
  }

  if (
    userId === currentUserProfile.id &&
    newRole !== "admin" &&
    newRole !== "super_admin"
  ) {
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
// CREAR USUARIO DIRECTO (Solo admins)
// Sin verificación de email: el admin asigna credenciales
// temporalmente hasta implementar el flujo de invitación.
// ============================================
const ASSIGNABLE_ROLES: UserRole[] = ["user", "volunteer", "editor", "admin"];

export async function serverCreateUser(input: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}): Promise<AuthActionResponse & { userId?: string }> {
  const { user: currentUser } = await serverGetUser();

  if (!currentUser || !["admin", "super_admin"].includes(currentUser.role)) {
    return { error: "No tienes permisos para realizar esta acción" };
  }

  const name = input.name?.trim();
  const email = input.email?.toLowerCase().trim();
  const password = input.password;

  if (!name || !email || !password) {
    return { error: "Nombre, email y contraseña son obligatorios" };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Formato de email inválido" };
  }
  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres" };
  }
  if (!ASSIGNABLE_ROLES.includes(input.role)) {
    return { error: "Rol inválido" };
  }

  try {
    // Mismo algoritmo de hash que usa Better-Auth en el login
    const hashedPassword = await hashPassword(password);

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      return { error: `Ya existe un usuario con el email ${email}` };
    }

    const userId = createId();

    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: userId,
          name,
          email,
          role: input.role,
          emailVerified: true, // directo, sin flujo de verificación
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      await tx.account.create({
        data: {
          id: createId(),
          accountId: userId,
          providerId: "credential",
          userId,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    });

    revalidatePath("/admin/usuarios");
    return { success: true, userId };
  } catch (error) {
    console.error("Error en serverCreateUser:", error);
    return { error: error instanceof Error ? error.message : "Algo salió mal" };
  }
}

// ============================================
// DAR DE BAJA USUARIO (Solo admins)
// Baja el rol a "user" Y elimina todas sus sesiones activas
// (logout inmediato en todos sus dispositivos). La cuenta se
// conserva para auditoría y posible reactivación.
// ============================================
export async function serverDeactivateUser(
  userId: string,
): Promise<AuthActionResponse> {
  const { user: currentUser } = await serverGetUser();

  if (!currentUser || !["admin", "super_admin"].includes(currentUser.role)) {
    return { error: "No tienes permisos para realizar esta acción" };
  }

  if (userId === currentUser.id) {
    return { error: "No puedes darte de baja a ti mismo" };
  }

  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { role: "user", updatedAt: new Date() },
      }),
      // Mata el token en todos sus dispositivos: la próxima request
      // ya no encontrará la sesión en la DB
      prisma.session.deleteMany({ where: { userId } }),
    ]);
    revalidatePath("/admin/usuarios");
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

// ============================================
// CAMBIAR / RESETEAR CONTRASEÑA (Solo admins)
// Hashea con scrypt de Better-Auth y actualiza la cuenta.
// Opcionalmente revoca todas las sesiones activas del usuario.
// ============================================
export async function serverAdminResetPassword(input: {
  userId: string;
  newPassword: string;
  revokeSessions?: boolean;
}): Promise<AuthActionResponse> {
  const { user: currentUser } = await serverGetUser();

  if (!currentUser || !["admin", "super_admin"].includes(currentUser.role)) {
    return { error: "No tienes permisos para realizar esta acción" };
  }

  const { userId, newPassword, revokeSessions = true } = input;

  if (!newPassword || newPassword.length < 6) {
    return { error: "La nueva contraseña debe tener al menos 6 caracteres" };
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!targetUser) {
      return { error: "Usuario no encontrado" };
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.$transaction(async (tx) => {
      const existingAccount = await tx.account.findFirst({
        where: {
          userId,
          providerId: "credential",
        },
      });

      if (existingAccount) {
        await tx.account.update({
          where: { id: existingAccount.id },
          data: {
            password: hashedPassword,
            updatedAt: new Date(),
          },
        });
      } else {
        await tx.account.create({
          data: {
            id: createId(),
            accountId: userId,
            providerId: "credential",
            userId,
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }

      if (revokeSessions) {
        await tx.session.deleteMany({
          where: { userId },
        });
      }
    });

    revalidatePath("/admin/usuarios");
    return { success: true };
  } catch (error) {
    console.error("Error en serverAdminResetPassword:", error);
    return {
      error: error instanceof Error ? error.message : "Algo salió mal",
    };
  }
}

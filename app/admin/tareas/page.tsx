import React from "react";
import { ContentLayout } from "@/components/admin/content-layout";
import { serverGetUser } from "@/lib/auth-actions";
import { redirect } from "next/navigation";
import { isRouteAllowedForRole } from "@/lib/rbac";
import { UserRole } from "@/interfaces/auth";
import {
  getBoardsSummary,
  getBoardWithDetails,
  getTeamMembers,
} from "./_lib/data";
import { TasksClient } from "./_components/tasks-client";

interface TasksPageProps {
  searchParams: Promise<{
    boardId?: string;
  }>;
}

export default async function AdminTasksPage(props: TasksPageProps) {
  const { user } = await serverGetUser();

  if (!user) {
    redirect("/auth/login?callbackUrl=/admin/tareas");
  }

  const userRole = (user.role || "volunteer") as UserRole;
  if (!isRouteAllowedForRole("/admin/tareas", userRole)) {
    redirect("/admin/unauthorized");
  }

  const searchParams = await props.searchParams;
  const targetBoardId = searchParams.boardId;

  // Asegurar boards predeterminados una sola vez
  const { ensureDefaultBoards } = await import("./_lib/data");
  await ensureDefaultBoards();

  const [boards, activeBoard, teamMembers] = await Promise.all([
    getBoardsSummary(),
    getBoardWithDetails(targetBoardId),
    getTeamMembers(),
  ]);

  if (!activeBoard) {
    return (
      <ContentLayout title="Proyectos y Tareas">
        <div className="p-8 text-center text-muted-foreground">
          No se encontró ningún tablero activo. Intenta recargar la página.
        </div>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout title="Proyectos y Tareas">
      <div className="h-full flex flex-col px-1 sm:px-2">
        <TasksClient
          boards={boards}
          initialBoard={activeBoard}
          teamMembers={teamMembers}
          currentUserId={user.id}
          userRole={userRole}
        />
      </div>
    </ContentLayout>
  );
}

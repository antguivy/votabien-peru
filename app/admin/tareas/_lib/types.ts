export type PriorityLevel = "BAJA" | "MEDIA" | "ALTA" | "URGENTE";

export type ProjectArea =
  | "INVESTIGACION"
  | "CONTENIDO"
  | "RECLUTAMIENTO"
  | "LEGAL"
  | "DESARROLLO"
  | "GENERAL";

export type AssignmentStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

export type ResourceType =
  | "drive"
  | "doc"
  | "sheet"
  | "figma"
  | "meet"
  | "link";

export interface SharedResource {
  id: string;
  title: string;
  url: string;
  type: ResourceType;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  assigned_user_id?: string;
}

export interface TaskAssignmentUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: string;
}

export interface TaskAssignment {
  id: string;
  task_id: string;
  user_id: string;
  status: AssignmentStatus;
  notes?: string | null;
  completed_at?: string | null;
  user: TaskAssignmentUser;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user: TaskAssignmentUser;
}

export interface TaskActivity {
  id: string;
  task_id: string;
  user_id?: string | null;
  action: string;
  details?: Record<string, unknown> | null;
  created_at: string;
  user?: TaskAssignmentUser | null;
}

export interface KanbanTask {
  id: string;
  board_id: string;
  column_id: string;
  title: string;
  description?: string | null;
  priority: PriorityLevel;
  position: number;
  due_date?: string | null;
  tags: string[];
  created_by_id?: string | null;
  resources: SharedResource[];
  checklist: ChecklistItem[];
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  assignments: TaskAssignment[];
  comments: TaskComment[];
  activities: TaskActivity[];
}

export interface KanbanColumn {
  id: string;
  board_id: string;
  title: string;
  position: number;
  color?: string | null;
  is_completed: boolean;
  tasks: KanbanTask[];
}

export interface KanbanBoard {
  id: string;
  title: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  area: ProjectArea;
  is_default: boolean;
  created_by_id?: string | null;
  created_at: string;
  updated_at: string;
  columns: KanbanColumn[];
}

export interface BoardSummary {
  id: string;
  title: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  area: ProjectArea;
  is_default: boolean;
  task_count: number;
  completed_count: number;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: string;
}

export interface TaskFilters {
  search?: string;
  priority?: PriorityLevel | "ALL";
  userId?: string | "ALL" | "MINE";
  dueDate?: "OVERDUE" | "TODAY" | "THIS_WEEK" | "ALL";
}

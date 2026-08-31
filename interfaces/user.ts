export type UserRole =
  | "user"
  | "volunteer"
  | "lead"
  | "editor"
  | "admin"
  | "super_admin";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
};

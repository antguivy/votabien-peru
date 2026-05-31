export type UserRole = "user" | "editor" | "admin";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
};

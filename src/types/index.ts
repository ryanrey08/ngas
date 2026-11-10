export type Role = "admin" | "accountant" | "budget_officer" | "viewer";

export type Permission =
  | "dashboard:view"
  | "transactions:view"
  | "transactions:manage"
  | "budget:view"
  | "budget:manage"
  | "reports:view"
  | "users:manage"
  | "settings:view";

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

export type AsyncStatus = "idle" | "loading" | "succeeded" | "failed";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  position: string;
  office: string;
  phone?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  type: "info" | "success" | "warning";
  href?: string;
}

export type SortDirection = "asc" | "desc";

"use client";

import { hasPermission } from "@/config/navigation";
import { useAppSelector } from "@/store/hooks";
import type { Permission } from "@/types";

export function usePermission(permission: Permission): boolean {
  const role = useAppSelector((s) => s.auth.user?.role);
  return hasPermission(role, permission);
}

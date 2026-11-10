import type { User } from "@/types";

export interface ManagedUser extends User {
  status: "Active" | "Inactive" | "Invited";
  lastActive: string;
}

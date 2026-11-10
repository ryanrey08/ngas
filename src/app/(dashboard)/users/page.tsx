import type { Metadata } from "next";
import { UsersView } from "@/features/users/components/UsersView";

export const metadata: Metadata = { title: "Users & Roles" };

export default function UsersPage() {
  return <UsersView />;
}

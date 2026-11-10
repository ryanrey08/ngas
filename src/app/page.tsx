import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ROUTES, SESSION_COOKIE } from "@/lib/constants";

export default async function RootPage() {
  const session = (await cookies()).get(SESSION_COOKIE);
  redirect(session ? ROUTES.dashboard : ROUTES.login);
}

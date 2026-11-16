import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, ROUTES } from "@/lib/constants";

export default async function RootPage() {
  const session = (await cookies()).get(AUTH_COOKIE);
  redirect(session ? ROUTES.dashboard : ROUTES.login);
}

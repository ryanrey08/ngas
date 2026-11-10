import type { Metadata } from "next";
import { HomeView } from "@/features/home/components/HomeView";

export const metadata: Metadata = { title: "Home" };

export default function HomePage() {
  return <HomeView />;
}

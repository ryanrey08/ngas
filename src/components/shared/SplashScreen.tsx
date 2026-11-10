import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Logo } from "./Logo";

export function SplashScreen() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-white">
      <Logo width={220} priority />
      <LoadingSpinner size="md" label="Loading NGAS…" />
    </div>
  );
}

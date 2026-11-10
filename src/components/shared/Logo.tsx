import Image from "next/image";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/logo/ngas-logo.png";
// Intrinsic size of public/logo/ngas-logo.png (612 × 408)
const LOGO_W = 612;
const LOGO_H = 408;

/** Full NGAS lockup (building mark + wordmark + tagline). */
export function Logo({ width = 180, className, priority }: { width?: number; className?: string; priority?: boolean }) {
  return (
    <Image
      src={LOGO_SRC}
      alt="NGAS — New Government Accounting System"
      width={width}
      height={Math.round((width * LOGO_H) / LOGO_W)}
      priority={priority}
      className={cn("h-auto select-none", className)}
    />
  );
}

/** Square crop of the logo's building mark for tight spaces (collapsed sidebar). */
export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <span className={cn("relative block overflow-hidden", className)} style={{ width: size, height: size }}>
      <Image
        src={LOGO_SRC}
        alt="NGAS"
        fill
        sizes={`${size * 3}px`}
        className="scale-[2.1] object-contain object-[50%_6%] select-none"
      />
    </span>
  );
}

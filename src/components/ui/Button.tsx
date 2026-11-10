import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "./LoadingSpinner";

/**
 * Variants follow the eNGAS mockups:
 * primary = brand red, blue = search/save/generate, success = post/new,
 * outline = back/print, outlineDanger = cancel/delete, excel = export to Excel.
 */
type Variant =
  | "primary"
  | "blue"
  | "success"
  | "secondary"
  | "outline"
  | "outlineDanger"
  | "excel"
  | "ghost"
  | "danger"
  | "dark";
type Size = "xs" | "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary: "bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800",
  blue: "bg-blue-600 text-white shadow-sm hover:bg-blue-700",
  success: "bg-green-700 text-white shadow-sm hover:bg-green-800",
  secondary: "bg-brand-50 text-brand-700 hover:bg-brand-100",
  outline: "border border-neutral-300 bg-white text-ink-900 hover:bg-neutral-50 hover:border-neutral-400",
  outlineDanger: "border border-brand-600 bg-white text-brand-700 hover:bg-brand-50",
  excel: "border border-green-600/60 bg-green-50 text-green-800 hover:bg-green-100",
  ghost: "text-neutral-700 hover:bg-neutral-100 hover:text-ink-900",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-700",
  dark: "bg-ink-900 text-white shadow-sm hover:bg-ink-700",
};

const sizes: Record<Size, string> = {
  xs: "h-7 gap-1 rounded-md px-2.5 text-xs",
  sm: "h-8 gap-1.5 rounded-md px-3 text-xs",
  md: "h-9 gap-2 rounded-lg px-4 text-sm",
  lg: "h-11 gap-2 rounded-lg px-5 text-base",
  icon: "h-8 w-8 rounded-md",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, leftIcon, rightIcon, fullWidth, className, children, disabled, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center font-semibold whitespace-nowrap transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
        "disabled:pointer-events-none disabled:opacity-60 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {loading ? <LoadingSpinner size="sm" className="text-current" label="" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
});

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FormField, controlClasses, describedBy } from "./FormField";

export interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
  containerClassName?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(function FormInput(
  { label, error, hint, leftIcon, rightSlot, id, required, className, containerClassName, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <FormField id={inputId} label={label} error={error} hint={hint} required={required} className={containerClassName}>
      <div className="relative">
        {leftIcon && (
          <span aria-hidden className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400 [&>svg]:h-4 [&>svg]:w-4">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(inputId, error, hint)}
          aria-required={required || undefined}
          className={controlClasses(!!error, cn("h-10", !!leftIcon && "pl-9", !!rightSlot && "pr-10", className))}
          {...props}
        />
        {rightSlot && <span className="absolute top-1/2 right-1.5 -translate-y-1/2">{rightSlot}</span>}
      </div>
    </FormField>
  );
});

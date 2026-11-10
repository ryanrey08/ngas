import { CalendarDays } from "lucide-react";
import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { FormField, controlClasses, describedBy } from "./FormField";

export interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

/** Native date input (accessible, mobile-friendly) styled to match the design system. */
export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker(
  { label, error, hint, id, required, className, containerClassName, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <FormField id={inputId} label={label} error={error} hint={hint} required={required} className={containerClassName}>
      <div className="relative">
        <CalendarDays aria-hidden className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          ref={ref}
          id={inputId}
          type="date"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(inputId, error, hint)}
          aria-required={required || undefined}
          className={controlClasses(!!error, `h-10 pl-9 ${className ?? ""}`)}
          {...props}
        />
      </div>
    </FormField>
  );
});

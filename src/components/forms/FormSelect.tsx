import { ChevronDown } from "lucide-react";
import { forwardRef, useId, type SelectHTMLAttributes } from "react";
import { FormField, controlClasses, describedBy } from "./FormField";

export interface SelectOption {
  label: string;
  value: string;
}

export interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: readonly SelectOption[] | readonly string[];
  placeholder?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(function FormSelect(
  { label, options, placeholder, error, hint, id, required, className, containerClassName, ...props },
  ref,
) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const normalized: SelectOption[] = options.map((o) => (typeof o === "string" ? { label: o, value: o } : o));
  return (
    <FormField id={selectId} label={label} error={error} hint={hint} required={required} className={containerClassName}>
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(selectId, error, hint)}
          aria-required={required || undefined}
          className={controlClasses(!!error, `h-10 appearance-none pr-9 ${className ?? ""}`)}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {normalized.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-neutral-500" />
      </div>
    </FormField>
  );
});

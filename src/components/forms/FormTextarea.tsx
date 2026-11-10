import { forwardRef, useId, type TextareaHTMLAttributes } from "react";
import { FormField, controlClasses, describedBy } from "./FormField";

export interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(function FormTextarea(
  { label, error, hint, id, required, rows = 3, className, containerClassName, ...props },
  ref,
) {
  const autoId = useId();
  const textareaId = id ?? autoId;
  return (
    <FormField id={textareaId} label={label} error={error} hint={hint} required={required} className={containerClassName}>
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(textareaId, error, hint)}
        aria-required={required || undefined}
        className={controlClasses(!!error, `resize-y py-2 ${className ?? ""}`)}
        {...props}
      />
    </FormField>
  );
});

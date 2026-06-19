import { SelectHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

/**
 * Styled select/dropdown matching the Input design token system.
 */
export function Select({ className, label, id, options, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-foreground/80">
          {label}
        </label>
      )}
      <select
        id={id}
        className={cn(
          "h-10 w-full rounded-md border border-border bg-background px-3 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "transition",
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

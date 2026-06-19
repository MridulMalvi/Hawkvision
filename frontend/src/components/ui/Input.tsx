import { InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Optional visible label rendered above the input. */
  label?: string;
  /** Optional error message rendered below the input in red. */
  error?: string;
}

/**
 * Styled input field with optional label and error state.
 * Matches the Card/Button visual style using design tokens.
 */
export function Input({ className, label, error, id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-foreground/80">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          "h-10 w-full rounded-md border border-border bg-background px-3 text-sm",
          "placeholder:text-foreground/40",
          "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "transition",
          error && "border-destructive focus:ring-destructive/40",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

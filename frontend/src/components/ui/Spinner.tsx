import { cn } from "../../lib/utils";

interface SpinnerProps {
  /** Size in pixels (default 20). */
  size?: number;
  className?: string;
}

/**
 * Accessible animated loading spinner using a CSS border trick.
 * Uses the primary design token colour by default.
 */
export function Spinner({ size = 20, className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      style={{ width: size, height: size }}
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-current border-t-transparent text-primary",
        className
      )}
    />
  );
}

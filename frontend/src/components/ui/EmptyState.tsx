import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

interface EmptyStateProps {
  /** Lucide icon to display. */
  icon: LucideIcon;
  /** Heading text. */
  title: string;
  /** Optional supporting description. */
  description?: string;
  /** Optional action element (e.g. a Button). */
  action?: ReactNode;
  className?: string;
}

/**
 * Centered empty-state placeholder with icon, title, optional description,
 * and optional action element.
 */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-10 text-center",
        className
      )}
    >
      <div className="rounded-full bg-muted p-4 text-foreground/40">
        <Icon size={32} />
      </div>
      <p className="font-semibold text-foreground">{title}</p>
      {description && <p className="text-sm text-foreground/60">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

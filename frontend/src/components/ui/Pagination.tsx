import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Pagination control bar — shows "X–Y of Z" and prev/next buttons.
 * Renders nothing when all results fit on one page.
 */
export function Pagination({ page, pageSize, total, onPageChange, className }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className={cn("flex items-center justify-between text-sm", className)}>
      <span className="text-foreground/60">
        {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md border border-border transition",
            page <= 1
              ? "cursor-not-allowed opacity-40"
              : "hover:bg-muted"
          )}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="px-2 font-medium">
          {page} / {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md border border-border transition",
            page >= totalPages
              ? "cursor-not-allowed opacity-40"
              : "hover:bg-muted"
          )}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

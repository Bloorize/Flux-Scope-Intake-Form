import { cn } from "../../lib/utils";

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-[var(--muted)]", className)}>
      <div
        className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent)_0%,#0f4c81_100%)] transition-all duration-300"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

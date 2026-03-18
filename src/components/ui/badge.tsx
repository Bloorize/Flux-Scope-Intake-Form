import * as React from "react";
import { cn } from "../../lib/utils";

const Badge = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--muted)] px-2.5 py-1 text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted-foreground)]",
      className
    )}
    {...props}
  />
);

export { Badge };

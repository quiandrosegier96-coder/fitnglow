import { cn } from "@/lib/utils";

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-3 overflow-hidden rounded-full bg-secondary/35", className)}>
      <div className="h-full rounded-full rose-gold" style={{ width: `${Math.max(0, Math.min(value, 100))}%` }} />
    </div>
  );
}

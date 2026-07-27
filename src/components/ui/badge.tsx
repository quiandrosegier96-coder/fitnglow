import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("inline-flex rounded-full bg-secondary/60 px-3 py-1 text-xs font-bold text-foreground", className)}
      {...props}
    />
  );
}

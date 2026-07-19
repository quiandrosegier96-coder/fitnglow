import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm outline-none placeholder:text-muted/65 focus:border-primary/45 focus:ring-4 focus:ring-primary/10",
        className
      )}
      {...props}
    />
  );
}

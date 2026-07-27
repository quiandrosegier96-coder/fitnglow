import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-white shadow-[0_12px_24px_rgba(248,122,162,0.20)] hover:bg-[#ef6e98] hover:-translate-y-0.5",
        secondary: "bg-secondary/45 text-foreground hover:bg-secondary/70",
        outline: "border border-border bg-card text-foreground hover:border-primary/35 hover:bg-secondary/20",
        ghost: "text-muted hover:bg-secondary/20 hover:text-foreground"
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

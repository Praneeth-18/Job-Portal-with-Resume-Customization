import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "glassmorphism bg-white/20 text-white",
        secondary: "glassmorphism bg-black/10 text-white",
        destructive: "glassmorphism bg-red-500/20 text-white",
        outline: "glassmorphism bg-transparent border border-white/20 text-white",
        success: "glassmorphism bg-green-500/20 text-white",
        warning: "glassmorphism bg-amber-500/20 text-white",
        glass: "glassmorphism bg-white/20 text-white",
        glassDark: "glassmorphism bg-black/20 text-white",
        glassFrost: "glassmorphism bg-white/20 text-white",
        primary: "badge--primary"
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants }; 
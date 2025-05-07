import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "glassmorphism bg-white/20 hover:bg-white/30 text-white shadow-md",
        destructive: "glassmorphism bg-red-500/20 hover:bg-red-500/30 text-white shadow-md",
        outline: "glassmorphism bg-transparent border border-white/20 hover:bg-white/10 text-white shadow-md",
        secondary: "glassmorphism bg-black/10 hover:bg-black/20 text-white shadow-md",
        ghost: "hover:bg-white/10 text-white hover:text-white",
        link: "text-white underline-offset-4 hover:underline",
        glass: "glassmorphism bg-white/20 hover:bg-white/30 text-white shadow-md",
        glassDark: "glassmorphism bg-black/20 hover:bg-black/30 text-white shadow-md",
        glassFrost: "glassmorphism bg-white/20 hover:bg-white/30 text-white shadow-lg transition-all",
        success: "glassmorphism bg-green-500/20 hover:bg-green-500/30 text-white shadow-md",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants }; 
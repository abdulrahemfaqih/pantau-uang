import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium transition-colors shadow-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-zinc-950 text-white",
        secondary: "border-transparent bg-zinc-100 text-zinc-900",
        outline: "border-zinc-200 text-zinc-950",
        income: "border-emerald-200 bg-emerald-50 text-emerald-800",
        expense: "border-red-200 bg-red-50 text-red-800",
        transfer: "border-blue-200 bg-blue-50 text-blue-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

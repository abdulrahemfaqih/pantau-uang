import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  wrapperClassName?: string;
};

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, wrapperClassName, children, ...props }, ref) => {
    return (
      <div className={cn("relative w-full", wrapperClassName)}>
        <select
          ref={ref}
          className={cn(
            "flex h-9 w-full appearance-none rounded-md border border-zinc-200 bg-white px-3 py-1 pr-8 text-sm text-zinc-950 shadow-none transition-colors",
            "cursor-pointer placeholder:text-zinc-400",
            "focus-visible:outline-none focus-visible:border-zinc-950 focus-visible:ring-1 focus-visible:ring-zinc-950",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };

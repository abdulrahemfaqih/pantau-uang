import * as React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  withText?: boolean;
  textClassName?: string;
}

const sizeMap = {
  sm: { icon: "h-6 w-6", svg: 24, text: "text-sm" },
  md: { icon: "h-8 w-8", svg: 32, text: "text-base font-bold" },
  lg: { icon: "h-11 w-11", svg: 44, text: "text-xl font-bold" },
  xl: { icon: "h-14 w-14", svg: 56, text: "text-2xl font-bold" },
};

export function LogoIcon({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
    >
      {/* Black Square Badge with sharp radius (6px / 7px) */}
      <rect width="32" height="32" rx="7" fill="#09090B" />

      {/* Wallet Body Outline */}
      <path
        d="M6 11.5C6 9.567 7.567 8 9.5 8H22.5C24.433 8 26 9.567 26 11.5V20.5C26 22.433 24.433 24 22.5 24H9.5C7.567 24 6 22.433 6 20.5V11.5Z"
        stroke="#FFFFFF"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      {/* Interior Card Edge / Upper Accent */}
      <path
        d="M6 13H26"
        stroke="#FFFFFF"
        strokeWidth="1.4"
        strokeOpacity="0.4"
      />

      {/* Wallet Flap & Clasp (Pantau / Monitoring Notch) */}
      <path
        d="M17 14.5H23.5C24.88 14.5 26 15.62 26 17V18C26 19.38 24.88 20.5 23.5 20.5H17C15.62 20.5 14.5 19.38 14.5 18V17C14.5 15.62 15.62 14.5 17 14.5Z"
        fill="#09090B"
        stroke="#FFFFFF"
        strokeWidth="1.5"
      />

      {/* Clasp Point / Coin Eye (Pantau Core) */}
      <circle cx="18" cy="17.5" r="1.3" fill="#FFFFFF" />
    </svg>
  );
}

export function Logo({
  size = "md",
  className,
  withText = false,
  textClassName,
}: LogoProps) {
  const currentSize = sizeMap[size];

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <div className={cn("rounded-md overflow-hidden flex items-center justify-center", currentSize.icon)}>
        <LogoIcon size={currentSize.svg} />
      </div>

      {withText && (
        <span className={cn("tracking-tight text-zinc-950 font-bold", currentSize.text, textClassName)}>
          PantauUang
        </span>
      )}
    </div>
  );
}

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format integer amount to Indonesian Rupiah representation: Rp 1.250.000
 * No decimals, strict integer Rupiah.
 */
export function formatRupiah(amount: number | bigint | string): string {
  const numericAmount = typeof amount === "string" ? parseInt(amount, 10) || 0 : Number(amount);
  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericAmount);

  // Intl usually produces "Rp 1.250.000" or "Rp1.250.000", ensure space after Rp
  return formatted.replace(/^Rp\s?/, "Rp ");
}

/**
 * Parse Rupiah string input back to integer number
 */
export function parseRupiahInput(value: string): number {
  const digitsOnly = value.replace(/\D/g, "");
  return digitsOnly ? parseInt(digitsOnly, 10) : 0;
}

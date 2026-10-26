"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowLeftRight, Landmark, Tags, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  onOpenQuickEntry: () => void;
}

export function BottomNav({ onOpenQuickEntry }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-zinc-900 px-2 py-1.5 flex items-center justify-around">
      <Link
        href="/"
        className={cn(
          "flex flex-col items-center justify-center py-1 px-2 text-xs font-medium",
          pathname === "/" ? "text-zinc-950 font-semibold" : "text-zinc-500 hover:text-zinc-950"
        )}
      >
        <LayoutDashboard className="h-5 w-5" />
        <span className="mt-1 text-[10px]">Beranda</span>
      </Link>

      <Link
        href="/transactions"
        className={cn(
          "flex flex-col items-center justify-center py-1 px-2 text-xs font-medium",
          pathname === "/transactions" ? "text-zinc-950 font-semibold" : "text-zinc-500 hover:text-zinc-950"
        )}
      >
        <ArrowLeftRight className="h-5 w-5" />
        <span className="mt-1 text-[10px]">Transaksi</span>
      </Link>

      {/* Prominent Quick Entry Action Button */}
      <div className="flex items-center justify-center px-1">
        <button
          onClick={onOpenQuickEntry}
          className="h-11 w-11 rounded-full bg-zinc-950 text-white flex items-center justify-center shadow-none hover:bg-zinc-800 transition-colors focus:outline-none cursor-pointer"
          aria-label="Catat Transaksi Cepat"
        >
          <Plus className="h-5 w-5 stroke-[2.5]" />
        </button>
      </div>

      <Link
        href="/accounts"
        className={cn(
          "flex flex-col items-center justify-center py-1 px-2 text-xs font-medium",
          pathname === "/accounts" ? "text-zinc-950 font-semibold" : "text-zinc-500 hover:text-zinc-950"
        )}
      >
        <Landmark className="h-5 w-5" />
        <span className="mt-1 text-[10px]">Rekening</span>
      </Link>

      <Link
        href="/categories"
        className={cn(
          "flex flex-col items-center justify-center py-1 px-2 text-xs font-medium",
          pathname === "/categories" ? "text-zinc-950 font-semibold" : "text-zinc-500 hover:text-zinc-950"
        )}
      >
        <Tags className="h-5 w-5" />
        <span className="mt-1 text-[10px]">Kategori</span>
      </Link>
    </nav>
  );
}

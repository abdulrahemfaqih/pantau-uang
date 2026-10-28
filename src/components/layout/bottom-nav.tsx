"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowLeftRight, Landmark, MoreHorizontal, Plus, Tags, Repeat, HandCoins, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { prefetchPageData } from "@/lib/prefetch";

interface BottomNavProps {
  onOpenQuickEntry: () => void;
}

const moreNavItems = [
  {
    label: "Kategori",
    href: "/categories",
    icon: Tags,
    description: "Kelola kategori pos pemasukan dan pengeluaran",
  },
  {
    label: "Transaksi Berulang",
    href: "/recurring",
    icon: Repeat,
    description: "Jadwal transaksi rutin otomatis",
  },
  {
    label: "Hutang & Piutang",
    href: "/debts",
    icon: HandCoins,
    description: "Catat dan pantau pinjaman uang",
  },
];

export function BottomNav({ onOpenQuickEntry }: BottomNavProps) {
  const [moreMenuOpen, setMoreMenuOpen] = React.useState(false);
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const [prevPathname, setPrevPathname] = React.useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMoreMenuOpen(false);
  }

  const isMoreActive = moreNavItems.some((item) => item.href === pathname);

  return (
    <>
      {/* Backdrop Menu Lainnya */}
      {moreMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden transition-opacity"
          onClick={() => setMoreMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sheet Menu Lainnya */}
      {moreMenuOpen && (
        <div
          className="fixed bottom-[57px] left-0 right-0 z-50 bg-white border-t border-zinc-900 p-4 lg:hidden rounded-t-md"
          role="dialog"
          aria-modal="true"
          aria-label="Menu Lainnya"
        >
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
            <div>
              <h3 className="text-sm font-bold text-zinc-950">Menu Lainnya</h3>
              <p className="text-[11px] text-zinc-500">Fitur tambahan yang tidak tampil di bar bawah</p>
            </div>
            <button
              onClick={() => setMoreMenuOpen(false)}
              className="p-1 rounded text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 transition-colors cursor-pointer"
              aria-label="Tutup Menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2 pt-3">
            {moreNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreMenuOpen(false)}
                  onMouseEnter={() => prefetchPageData(queryClient, item.href)}
                  onTouchStart={() => prefetchPageData(queryClient, item.href)}
                  className={cn(
                    "flex items-center gap-3 p-2.5 rounded-md border transition-colors",
                    isActive
                      ? "bg-zinc-100 border-zinc-900 text-zinc-950 font-semibold"
                      : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 hover:border-zinc-300"
                  )}
                >
                  <div
                    className={cn(
                      "h-9 w-9 rounded-md flex items-center justify-center shrink-0",
                      isActive ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-900"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-zinc-950">{item.label}</div>
                    <div className="text-[11px] text-zinc-500 truncate">{item.description}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-zinc-900 px-2 py-1.5 flex items-center justify-around">
        <Link
          id="tour-dashboard-mobile"
          href="/"
          onMouseEnter={() => prefetchPageData(queryClient, "/")}
          onTouchStart={() => prefetchPageData(queryClient, "/")}
          className={cn(
            "flex flex-col items-center justify-center py-1 px-2 text-xs font-medium",
            pathname === "/" ? "text-zinc-950 font-semibold" : "text-zinc-500 hover:text-zinc-950"
          )}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="mt-1 text-[10px]">Beranda</span>
        </Link>

        <Link
          id="tour-transactions-mobile"
          href="/transactions"
          onMouseEnter={() => prefetchPageData(queryClient, "/transactions")}
          onTouchStart={() => prefetchPageData(queryClient, "/transactions")}
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
            id="tour-quick-mobile"
            onClick={onOpenQuickEntry}
            className="h-11 w-11 rounded-full bg-zinc-950 text-white flex items-center justify-center shadow-none hover:bg-zinc-800 transition-colors focus:outline-none cursor-pointer"
            aria-label="Catat Transaksi Cepat"
          >
            <Plus className="h-5 w-5 stroke-[2.5]" />
          </button>
        </div>

        <Link
          id="tour-accounts-mobile"
          href="/accounts"
          onMouseEnter={() => prefetchPageData(queryClient, "/accounts")}
          onTouchStart={() => prefetchPageData(queryClient, "/accounts")}
          className={cn(
            "flex flex-col items-center justify-center py-1 px-2 text-xs font-medium",
            pathname === "/accounts" ? "text-zinc-950 font-semibold" : "text-zinc-500 hover:text-zinc-950"
          )}
        >
          <Landmark className="h-5 w-5" />
          <span className="mt-1 text-[10px]">Rekening</span>
        </Link>

        {/* Menu Lainnya Button */}
        <button
          id="tour-more-mobile"
          type="button"
          onClick={() => setMoreMenuOpen((prev) => !prev)}
          className={cn(
            "flex flex-col items-center justify-center py-1 px-2 text-xs font-medium transition-colors cursor-pointer focus:outline-none",
            isMoreActive || moreMenuOpen ? "text-zinc-950 font-semibold" : "text-zinc-500 hover:text-zinc-950"
          )}
          aria-label="Menu Lainnya"
          aria-expanded={moreMenuOpen}
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="mt-1 text-[10px]">Lainnya</span>
        </button>
      </nav>
    </>
  );
}

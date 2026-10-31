"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowLeftRight, Landmark, MoreHorizontal, Plus, Tags, Repeat, HandCoins, X, Bike, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { prefetchPageData } from "@/lib/prefetch";
import { useDriverMode } from "@/hooks/use-driver-mode";

interface BottomNavProps {
  onOpenQuickEntry: () => void;
  onOpenDriverOrder?: () => void;
  moreMenuOpen?: boolean;
  onMoreMenuOpenChange?: (open: boolean) => void;
  hideBackdrop?: boolean;
}

const moreNavItems = [
  {
    label: "Statistik",
    href: "/statistics",
    icon: BarChart3,
    description: "Grafik pengeluaran harian, bulanan, dan tahunan",
  },
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

export function BottomNav({
  onOpenQuickEntry,
  onOpenDriverOrder,
  moreMenuOpen: controlledMoreMenuOpen,
  onMoreMenuOpenChange,
  hideBackdrop = false,
}: BottomNavProps) {
  const [internalMoreMenuOpen, setInternalMoreMenuOpen] = React.useState(false);
  const isControlled = controlledMoreMenuOpen !== undefined;
  const moreMenuOpen = isControlled ? controlledMoreMenuOpen : internalMoreMenuOpen;

  const moreMenuOpenRef = React.useRef(moreMenuOpen);
  moreMenuOpenRef.current = moreMenuOpen;

  const onMoreMenuOpenChangeRef = React.useRef(onMoreMenuOpenChange);
  onMoreMenuOpenChangeRef.current = onMoreMenuOpenChange;

  const setMoreMenuOpen = React.useCallback(
    (open: boolean | ((prev: boolean) => boolean)) => {
      const nextVal = typeof open === "function" ? open(moreMenuOpenRef.current) : open;
      if (!isControlled) {
        setInternalMoreMenuOpen(nextVal);
      }
      onMoreMenuOpenChangeRef.current?.(nextVal);
    },
    [isControlled]
  );

  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { isDriver, toggleDriverMode, isUpdating } = useDriverMode();

  const prevPathnameRef = React.useRef(pathname);
  React.useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      setMoreMenuOpen(false);
    }
  }, [pathname, setMoreMenuOpen]);

  const isMoreActive = moreNavItems.some((item) => item.href === pathname);

  return (
    <>
      {/* Backdrop Menu Lainnya (disembunyikan saat overlay tour aktif agar tidak bentrok) */}
      {moreMenuOpen && !hideBackdrop && (
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
            {/* Toggle Mode Driver (Ojol / COD) */}
            <div id="tour-driver-mode-mobile" className="flex items-center justify-between p-2.5 rounded-md border border-zinc-200 bg-zinc-50">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-md bg-zinc-950 text-white flex items-center justify-center shrink-0">
                  <Bike className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-950">Mode Driver (Ojol)</div>
                  <div className="text-[11px] text-zinc-500">Tampilkan menu order & COD</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggleDriverMode()}
                disabled={isUpdating}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0",
                  isDriver ? "bg-zinc-950" : "bg-zinc-300"
                )}
                aria-label="Toggle Mode Driver"
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    isDriver ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>

            {/* Menu Aksi Order Driver (Hanya tampil jika Mode Driver aktif) */}
            {isDriver && onOpenDriverOrder && (
              <button
                type="button"
                onClick={() => {
                  setMoreMenuOpen(false);
                  onOpenDriverOrder();
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-md border border-zinc-900 bg-zinc-950 text-white hover:bg-zinc-800 transition-colors text-left cursor-pointer"
              >
                <div className="h-9 w-9 rounded-md flex items-center justify-center shrink-0 bg-white/10 text-white">
                  <Bike className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-white">Order Driver (COD)</div>
                  <div className="text-[11px] text-zinc-300 truncate">Pencatatan cepat pesanan ojol dan setoran tunai COD</div>
                </div>
              </button>
            )}

            {moreNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              const tourId =
                item.href === "/recurring"
                  ? "tour-recurring-mobile"
                  : item.href === "/debts"
                  ? "tour-debts-mobile"
                  : item.href === "/categories"
                  ? "tour-categories-mobile"
                  : undefined;

              return (
                <Link
                  key={item.href}
                  id={tourId}
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

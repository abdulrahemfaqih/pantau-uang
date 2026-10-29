"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowLeftRight, Landmark, Tags, Plus, Wallet, LogOut, Repeat, HandCoins, HelpCircle, Bike } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { prefetchPageData } from "@/lib/prefetch";

import { useDriverMode } from "@/hooks/use-driver-mode";

interface User {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface SidebarProps {
  user?: User;
  onOpenQuickEntry: () => void;
  onOpenDriverOrder?: () => void;
  onStartTour?: () => void;
}

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Transaksi", href: "/transactions", icon: ArrowLeftRight },
  { label: "Rekening", href: "/accounts", icon: Landmark },
  { label: "Kategori", href: "/categories", icon: Tags },
  { label: "Berulang", href: "/recurring", icon: Repeat },
  { label: "Hutang Piutang", href: "/debts", icon: HandCoins },
];

export function Sidebar({ user, onOpenQuickEntry, onOpenDriverOrder, onStartTour }: SidebarProps) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { isDriver, toggleDriverMode, isUpdating } = useDriverMode();

  return (
    <aside className="hidden lg:flex w-60 flex-col border-r border-zinc-200 bg-white min-h-screen fixed left-0 top-0 bottom-0 z-30">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-zinc-200">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-zinc-950 tracking-tight text-lg">
          <div className="h-7 w-7 rounded-md bg-zinc-950 text-white flex items-center justify-center">
            <Wallet className="h-4 w-4" />
          </div>
          <span>PantauUang</span>
        </Link>
      </div>

      {/* Action CTA */}
      <div className="p-4 space-y-2">
        <Button
          id="tour-quick-entry"
          onClick={onOpenQuickEntry}
          className="w-full flex items-center justify-center gap-2 bg-zinc-950 text-white hover:bg-zinc-800"
        >
          <Plus className="h-4 w-4" />
          <span>Catat Transaksi</span>
        </Button>
        {isDriver && onOpenDriverOrder && (
          <Button
            onClick={onOpenDriverOrder}
            variant="outline"
            className="w-full flex items-center justify-center gap-2 border-zinc-200 hover:bg-zinc-100 text-zinc-950 text-xs font-medium"
          >
            <Bike className="h-3.5 w-3.5" />
            <span>Order Driver (COD)</span>
          </Button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const tourId =
            item.href === "/"
              ? "tour-dashboard"
              : item.href === "/transactions"
              ? "tour-transactions"
              : item.href === "/accounts"
              ? "tour-accounts"
              : item.href === "/categories"
              ? "tour-categories"
              : item.href === "/recurring"
              ? "tour-recurring"
              : item.href === "/debts"
              ? "tour-debts"
              : undefined;

          return (
            <Link
              key={item.href}
              id={tourId}
              href={item.href}
              onMouseEnter={() => prefetchPageData(queryClient, item.href)}
              onFocus={() => prefetchPageData(queryClient, item.href)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-zinc-100 text-zinc-950 font-semibold"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Toggle Mode Driver di Desktop Sidebar */}
      <div id="tour-driver-mode" className="px-3 py-2 border-t border-zinc-200">
        <div className="flex items-center justify-between p-2 rounded-md bg-zinc-50 border border-zinc-200">
          <div className="flex items-center gap-2 min-w-0">
            <Bike className="h-3.5 w-3.5 text-zinc-700 shrink-0" />
            <span className="text-xs font-medium text-zinc-800 truncate">Mode Ojol</span>
          </div>
          <button
            type="button"
            onClick={() => toggleDriverMode()}
            disabled={isUpdating}
            className={cn(
              "relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer shrink-0",
              isDriver ? "bg-zinc-950" : "bg-zinc-300"
            )}
            aria-label="Toggle Mode Driver"
          >
            <span
              className={cn(
                "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform",
                isDriver ? "translate-x-4.5" : "translate-x-0.5"
              )}
            />
          </button>
        </div>
      </div>

      {/* User Info & Logout Button */}
      {user && (
        <div className="p-3 border-t border-zinc-200">
          <div className="flex items-center justify-between p-2 rounded-md hover:bg-zinc-50 transition-colors">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-semibold text-zinc-900 truncate">
                {user.name || "Pengguna"}
              </p>
              <p className="text-[11px] text-zinc-400 truncate">
                {user.email}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {onStartTour && (
                <button
                  onClick={onStartTour}
                  className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-950 hover:bg-zinc-200 transition-colors cursor-pointer shrink-0"
                  title="Panduan Menu"
                  aria-label="Panduan Menu"
                >
                  <HelpCircle className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-950 hover:bg-zinc-200 transition-colors cursor-pointer shrink-0"
                title="Keluar (Logout)"
                aria-label="Keluar"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

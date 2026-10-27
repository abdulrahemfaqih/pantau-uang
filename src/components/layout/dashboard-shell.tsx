"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { TransactionModal } from "@/components/forms/transaction-modal";
import { signOut } from "next-auth/react";
import { LogOut, Menu, X, LayoutDashboard, ArrowLeftRight, Landmark, Tags, Repeat, HandCoins } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface User {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface DashboardShellProps {
  user: User;
  children: React.ReactNode;
}

const mobileNavLinks = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Transaksi", href: "/transactions", icon: ArrowLeftRight },
  { label: "Rekening", href: "/accounts", icon: Landmark },
  { label: "Kategori", href: "/categories", icon: Tags },
  { label: "Transaksi Berulang", href: "/recurring", icon: Repeat },
  { label: "Hutang & Piutang", href: "/debts", icon: HandCoins },
];

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [quickEntryOpen, setQuickEntryOpen] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-white text-zinc-950 flex flex-col">
      {/* Desktop Sidebar */}
      <Sidebar user={user} onOpenQuickEntry={() => setQuickEntryOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-60 flex flex-col">
        {/* Mobile Top Header */}
        <header className="lg:hidden h-14 border-b border-zinc-200 px-4 flex items-center justify-between bg-white sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1 rounded text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 transition-colors cursor-pointer"
              aria-label="Buka Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="h-6 w-6 rounded bg-zinc-950 text-white flex items-center justify-center font-bold text-xs">
              P
            </div>
            <span className="font-bold text-sm tracking-tight text-zinc-950">PantauUang</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-600 truncate max-w-[120px]">
              {user.name || user.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-1 rounded text-zinc-400 hover:text-zinc-950 transition-colors"
              title="Keluar"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Mobile Slide-down Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-zinc-200 px-4 py-3 space-y-1 z-30 sticky top-14 shadow-sm">
            {mobileNavLinks.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-zinc-100 text-zinc-950 font-semibold"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
                  )}
                >
                  <Icon className="h-4 w-4 text-zinc-500" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav onOpenQuickEntry={() => setQuickEntryOpen(true)} />

      {/* Quick Entry Modal */}
      <TransactionModal open={quickEntryOpen} onOpenChange={setQuickEntryOpen} />
    </div>
  );
}

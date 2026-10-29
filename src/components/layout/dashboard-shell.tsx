"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { TransactionModal } from "@/components/forms/transaction-modal";
import { DriverOrderModal } from "@/components/forms/driver-order-modal";
import { signOut } from "next-auth/react";
import { LogOut, Wallet, HelpCircle } from "lucide-react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { prefetchPageData } from "@/lib/prefetch";
import { GuidedTour } from "@/components/layout/guided-tour";

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

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [quickEntryOpen, setQuickEntryOpen] = React.useState(false);
  const [driverOrderOpen, setDriverOrderOpen] = React.useState(false);
  const [tourForced, setTourForced] = React.useState(false);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    // Warm up critical cache in the background
    prefetchPageData(queryClient, "/accounts");
    prefetchPageData(queryClient, "/categories");
    prefetchPageData(queryClient, "/transactions");
  }, [queryClient]);

  return (
    <div className="min-h-screen bg-white text-zinc-950 flex flex-col">
      {/* Desktop Sidebar */}
      <Sidebar
        user={user}
        onOpenQuickEntry={() => setQuickEntryOpen(true)}
        onOpenDriverOrder={() => setDriverOrderOpen(true)}
        onStartTour={() => setTourForced(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-60 flex flex-col">
        {/* Mobile Top Header (Tanpa hamburger menu) */}
        <header className="lg:hidden h-14 border-b border-zinc-200 px-4 flex items-center justify-between bg-white sticky top-0 z-20">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-zinc-950 text-white flex items-center justify-center">
              <Wallet className="h-4 w-4" />
            </div>
            <span className="font-bold text-sm tracking-tight text-zinc-950">PantauUang</span>
          </Link>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setTourForced(true)}
              className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 transition-colors cursor-pointer"
              title="Panduan Menu"
              aria-label="Panduan Menu"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
            <span className="text-xs text-zinc-600 truncate max-w-[120px]">
              {user.name || user.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 transition-colors cursor-pointer"
              title="Keluar"
              aria-label="Keluar"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        onOpenQuickEntry={() => setQuickEntryOpen(true)}
        onOpenDriverOrder={() => setDriverOrderOpen(true)}
      />

      {/* Quick Entry Modal */}
      <TransactionModal open={quickEntryOpen} onOpenChange={setQuickEntryOpen} />

      {/* Driver Order Modal */}
      <DriverOrderModal open={driverOrderOpen} onOpenChange={setDriverOrderOpen} />

      {/* Interactive Animated Guided Tour untuk Pengguna Baru */}
      <GuidedTour forceOpen={tourForced} onClose={() => setTourForced(false)} />
    </div>
  );
}

"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { TransactionModal } from "@/components/forms/transaction-modal";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/ui/logo";

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

  return (
    <div className="min-h-screen bg-white text-zinc-950 flex flex-col">
      {/* Desktop Sidebar */}
      <Sidebar user={user} onOpenQuickEntry={() => setQuickEntryOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-60 flex flex-col">
        {/* Mobile Top Header */}
        <header className="lg:hidden h-14 border-b border-zinc-200 px-4 flex items-center justify-between bg-white sticky top-0 z-20">
          <div className="flex items-center gap-2">
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

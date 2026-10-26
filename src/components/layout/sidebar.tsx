"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowLeftRight, Landmark, Tags, Plus, Wallet, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

import { Logo } from "@/components/ui/logo";

interface User {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface SidebarProps {
  user?: User;
  onOpenQuickEntry: () => void;
}

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Transaksi", href: "/transactions", icon: ArrowLeftRight },
  { label: "Rekening", href: "/accounts", icon: Landmark },
  { label: "Kategori", href: "/categories", icon: Tags },
];

export function Sidebar({ user, onOpenQuickEntry }: SidebarProps) {
  const pathname = usePathname();

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
      <div className="p-4">
        <Button
          onClick={onOpenQuickEntry}
          className="w-full flex items-center justify-center gap-2 bg-zinc-950 text-white hover:bg-zinc-800"
        >
          <Plus className="h-4 w-4" />
          <span>Catat Transaksi</span>
        </Button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
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
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-950 hover:bg-zinc-200 transition-colors cursor-pointer shrink-0"
              title="Keluar (Logout)"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

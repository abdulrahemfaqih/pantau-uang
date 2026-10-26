"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatRupiah } from "@/lib/utils";
import { Account } from "@/db/schema";
import { ArrowUpRight, EyeOff } from "lucide-react";

interface AccountsCardProps {
  accounts: Account[];
}

export function AccountsCard({ accounts }: AccountsCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-zinc-100 flex flex-row items-center justify-between">
        <CardTitle>Daftar Rekening</CardTitle>
        <Link
          href="/accounts"
          className="text-xs font-medium text-zinc-600 hover:text-zinc-950 flex items-center gap-1 transition-colors"
        >
          <span>Kelola</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        {accounts.length === 0 ? (
          <div className="p-6 text-center text-zinc-400 text-xs">
            Belum ada rekening dibuat.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="p-3.5 sm:px-5 flex items-center justify-between hover:bg-zinc-50 transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5">
                  {/* Muted account accent indicator (8px x 8px dot) */}
                  <div
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: acc.color || "#09090B" }}
                  />
                  <div>
                    <div className="font-medium text-zinc-900 flex items-center gap-1.5">
                      <span>{acc.name}</span>
                      {acc.excludeFromTotal && (
                        <span title="Disembunyikan dari total">
                          <EyeOff className="h-3 w-3 text-zinc-400" />
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-500 uppercase font-mono mt-0.5">
                      {acc.type}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-semibold tabular-nums text-zinc-950 text-sm">
                    {formatRupiah(Number(acc.currentBalance))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

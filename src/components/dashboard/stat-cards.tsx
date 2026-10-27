"use client";

import { Card } from "@/components/ui/card";
import { formatRupiah } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight, Wallet, EyeOff } from "lucide-react";

interface StatCardsProps {
  totalBalance: number;
  hiddenAccountsCount: number;
  monthlyIncome: number;
  monthlyExpense: number;
  netCashflow: number;
  currentMonthName: string;
}

export function StatCards({
  totalBalance,
  hiddenAccountsCount,
  monthlyIncome,
  monthlyExpense,
  netCashflow,
  currentMonthName,
}: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Kartu 1: Total Saldo Gabungan */}
      <Card className="p-5">
        <div className="flex items-center justify-between text-zinc-500 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Total Saldo Gabungan</span>
          <Wallet className="h-4 w-4 text-zinc-400" />
        </div>
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 tabular-nums">
          {formatRupiah(totalBalance)}
        </div>
        <div className="mt-2 flex items-center text-xs text-zinc-500">
          {hiddenAccountsCount > 0 ? (
            <span className="inline-flex items-center gap-1 text-zinc-500">
              <EyeOff className="h-3.5 w-3.5" />
              <span>{hiddenAccountsCount} rekening disembunyikan</span>
            </span>
          ) : (
            <span>Semua rekening aktif terhitung</span>
          )}
        </div>
      </Card>

      {/* Kartu 2: Pemasukan Bulan Ini */}
      <Card className="p-5">
        <div className="flex items-center justify-between text-zinc-500 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Pemasukan ({currentMonthName})</span>
          <ArrowDownLeft className="h-4 w-4 text-emerald-700" />
        </div>
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-700 tabular-nums">
          {formatRupiah(monthlyIncome)}
        </div>
        <div className="mt-2 text-xs text-zinc-500">
          <span>Khusus arus kas masuk rekening</span>
        </div>
      </Card>

      {/* Kartu 3: Pengeluaran Bulan Ini & Arus Kas Bersih */}
      <Card className="p-5">
        <div className="flex items-center justify-between text-zinc-500 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Pengeluaran ({currentMonthName})</span>
          <ArrowUpRight className="h-4 w-4 text-red-700" />
        </div>
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-red-700 tabular-nums">
          {formatRupiah(monthlyExpense)}
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
          <span>Arus Kas Bersih:</span>
          <span
            className={`font-semibold tabular-nums ${
              netCashflow >= 0 ? "text-emerald-700" : "text-red-700"
            }`}
          >
            {netCashflow >= 0 ? "+" : ""}
            {formatRupiah(netCashflow)}
          </span>
        </div>
      </Card>
    </div>
  );
}

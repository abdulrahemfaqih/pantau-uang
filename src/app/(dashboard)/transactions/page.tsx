"use client";

import * as React from "react";
import { useTransactions } from "@/hooks/use-transactions";
import { useAccounts } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRupiah } from "@/lib/utils";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Search, RotateCcw, Trash2 } from "lucide-react";

export default function TransactionsPage() {
  const [search, setSearch] = React.useState("");
  const [type, setType] = React.useState<"INCOME" | "EXPENSE" | "TRANSFER" | "">("");
  const [accountId, setAccountId] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [minAmount, setMinAmount] = React.useState("");
  const [maxAmount, setMaxAmount] = React.useState("");

  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();

  const activeFiltersCount = [search, type, accountId, categoryId, minAmount, maxAmount].filter(Boolean).length;

  const filterParams = React.useMemo(() => ({
    search: search || undefined,
    type: type || undefined,
    accountId: accountId || undefined,
    categoryId: categoryId || undefined,
    minAmount: minAmount ? parseInt(minAmount, 10) : undefined,
    maxAmount: maxAmount ? parseInt(maxAmount, 10) : undefined,
  }), [search, type, accountId, categoryId, minAmount, maxAmount]);

  const { data: transactions = [], isLoading, deleteTransaction } = useTransactions(filterParams);

  const handleReset = () => {
    setSearch("");
    setType("");
    setAccountId("");
    setCategoryId("");
    setMinAmount("");
    setMaxAmount("");
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus transaksi ini? Saldo rekening akan disesuaikan kembali.")) {
      await deleteTransaction(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Riwayat Transaksi</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Daftar seluruh aktivitas arus kas rekening Anda.</p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search by note */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
            <Input
              type="text"
              placeholder="Cari catatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>

          {/* Type dropdown */}
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="h-9 rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-800 focus:outline-none focus:border-zinc-950"
          >
            <option value="">Semua Tipe Transaksi</option>
            <option value="EXPENSE">Pengeluaran</option>
            <option value="INCOME">Pemasukan</option>
            <option value="TRANSFER">Transfer</option>
          </select>

          {/* Account dropdown */}
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="h-9 rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-800 focus:outline-none focus:border-zinc-950"
          >
            <option value="">Semua Rekening</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>

          {/* Category dropdown */}
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="h-9 rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-800 focus:outline-none focus:border-zinc-950"
          >
            <option value="">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.type === "INCOME" ? "Masuk" : "Keluar"})
              </option>
            ))}
          </select>
        </div>

        {/* Second row of filters & reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-zinc-100">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Nominal:</span>
            <Input
              type="number"
              placeholder="Min (Rp)"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="h-8 w-28 text-xs tabular-nums"
            />
            <span className="text-zinc-400 text-xs">-</span>
            <Input
              type="number"
              placeholder="Maks (Rp)"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="h-8 w-28 text-xs tabular-nums"
            />
          </div>

          {activeFiltersCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-8 text-xs flex items-center gap-1.5 text-zinc-600 hover:text-zinc-950"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Filter ({activeFiltersCount})</span>
            </Button>
          )}
        </div>
      </Card>

      {/* Transactions List */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : transactions.length === 0 ? (
        <Card className="p-8 text-center text-xs text-zinc-400">
          Tidak ada transaksi yang cocok dengan filter yang dipilih.
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Tipe / Kategori</th>
                  <th className="py-3 px-4">Catatan</th>
                  <th className="py-3 px-4">Rekening</th>
                  <th className="py-3 px-4 text-right">Nominal</th>
                  <th className="py-3 px-4 text-center w-12">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {transactions.map((tx) => {
                  const formattedDate = format(new Date(tx.date), "dd MMM yyyy", {
                    locale: localeId,
                  });

                  let badgeVariant: "income" | "expense" | "transfer" = "expense";
                  let prefix = "-";
                  let amountColor = "text-red-700";

                  if (tx.type === "INCOME") {
                    badgeVariant = "income";
                    prefix = "+";
                    amountColor = "text-emerald-700";
                  } else if (tx.type === "TRANSFER") {
                    badgeVariant = "transfer";
                    prefix = "";
                    amountColor = "text-blue-700";
                  }

                  return (
                    <tr key={tx.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="py-3 px-4 tabular-nums text-zinc-600 whitespace-nowrap">
                        {formattedDate}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Badge variant={badgeVariant} className="text-[10px] px-1.5 py-0.5">
                            {tx.type === "INCOME" ? "Masuk" : tx.type === "EXPENSE" ? "Keluar" : "Transfer"}
                          </Badge>
                          <span className="font-medium text-zinc-950">
                            {tx.type === "TRANSFER"
                              ? `${tx.account?.name || "Asal"} → ${tx.toAccount?.name || "Tujuan"}`
                              : tx.category?.name || "Tanpa Kategori"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-zinc-600 max-w-xs truncate">
                        {tx.note || "-"}
                      </td>
                      <td className="py-3 px-4 text-zinc-600 whitespace-nowrap">
                        {tx.account?.name}
                      </td>
                      <td className={`py-3 px-4 text-right font-semibold tabular-nums ${amountColor} whitespace-nowrap`}>
                        {prefix}{formatRupiah(Number(tx.amount))}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="p-1 rounded text-zinc-400 hover:text-red-700 transition-colors cursor-pointer"
                          title="Hapus transaksi"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Single Row Cards View */}
          <div className="md:hidden divide-y divide-zinc-200">
            {transactions.map((tx) => {
              const formattedDate = format(new Date(tx.date), "dd MMM yyyy", {
                locale: localeId,
              });

              let badgeVariant: "income" | "expense" | "transfer" = "expense";
              let prefix = "-";
              let amountColor = "text-red-700";

              if (tx.type === "INCOME") {
                badgeVariant = "income";
                prefix = "+";
                amountColor = "text-emerald-700";
              } else if (tx.type === "TRANSFER") {
                badgeVariant = "transfer";
                prefix = "";
                amountColor = "text-blue-700";
              }

              return (
                <div key={tx.id} className="p-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <Badge variant={badgeVariant} className="text-[9px] px-1.5 py-0.5">
                      {tx.type === "INCOME" ? "Masuk" : tx.type === "EXPENSE" ? "Keluar" : "Transfer"}
                    </Badge>
                    <div>
                      <div className="font-medium text-zinc-950">
                        {tx.type === "TRANSFER"
                          ? `${tx.account?.name} → ${tx.toAccount?.name}`
                          : tx.category?.name || "Tanpa Kategori"}
                      </div>
                      <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                        <span className="tabular-nums">{formattedDate}</span>
                        <span>•</span>
                        <span>{tx.account?.name}</span>
                      </div>
                      {tx.note && <div className="text-[11px] text-zinc-400 mt-0.5">{tx.note}</div>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-right">
                    <div>
                      <div className={`font-semibold tabular-nums text-sm ${amountColor}`}>
                        {prefix}{formatRupiah(Number(tx.amount))}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="p-1 rounded text-zinc-400 hover:text-red-700 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

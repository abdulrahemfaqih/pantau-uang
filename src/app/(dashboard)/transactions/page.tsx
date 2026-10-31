"use client";

import * as React from "react";
import { useTransactions, TransactionWithDetails } from "@/hooks/use-transactions";
import { useAccounts } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionModal } from "@/components/forms/transaction-modal";
import { DriverOrderModal } from "@/components/forms/driver-order-modal";
import { useDriverMode } from "@/hooks/use-driver-mode";
import { cn, formatRupiah } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Search, RotateCcw, Trash2, Pencil, Bike, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

export default function TransactionsPage() {
  const [currentDate, setCurrentDate] = React.useState<Date>(() => new Date());
  const [isAllTime, setIsAllTime] = React.useState(true);
  const [expandedDates, setExpandedDates] = React.useState<Set<string>>(() => new Set());

  const [search, setSearch] = React.useState("");
  const [type, setType] = React.useState<"INCOME" | "EXPENSE" | "TRANSFER" | "">("");
  const [accountId, setAccountId] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [minAmount, setMinAmount] = React.useState("");
  const [maxAmount, setMaxAmount] = React.useState("");
  const [editingTx, setEditingTx] = React.useState<TransactionWithDetails | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = React.useState(false);

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();
  const monthName = format(currentDate, "MMMM yyyy", { locale: localeId });

  const handlePrevMonth = () => {
    setIsAllTime(false);
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setIsAllTime(false);
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const { isDriver } = useDriverMode();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();

  const activeFiltersCount = [
    isAllTime ? "all-time" : "",
    search,
    type,
    accountId,
    categoryId,
    minAmount,
    maxAmount,
  ].filter(Boolean).length;

  const filterParams = React.useMemo(() => ({
    month: isAllTime ? undefined : month,
    year: isAllTime ? undefined : year,
    search: search || undefined,
    type: type || undefined,
    accountId: accountId || undefined,
    categoryId: categoryId || undefined,
    minAmount: minAmount ? parseInt(minAmount, 10) : undefined,
    maxAmount: maxAmount ? parseInt(maxAmount, 10) : undefined,
  }), [isAllTime, month, year, search, type, accountId, categoryId, minAmount, maxAmount]);

  const { data: transactions = [], isLoading, deleteTransaction } = useTransactions(filterParams);

  // Kalkulasi total pemasukan & pengeluaran untuk filter aktif saat ini
  const { totalFilteredIncome, totalFilteredExpense } = React.useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const tx of transactions) {
      const amount = Number(tx.amount);
      if (tx.type === "INCOME") inc += amount;
      else if (tx.type === "EXPENSE") exp += amount;
    }
    return { totalFilteredIncome: inc, totalFilteredExpense: exp };
  }, [transactions]);

  // Pengelompokan transaksi berdasarkan tanggal (Daily Grouping)
  const groupedTransactions = React.useMemo(() => {
    const groups: Array<{
      dateKey: string;
      dateLabel: string;
      isToday: boolean;
      isYesterday: boolean;
      totalIncome: number;
      totalExpense: number;
      items: TransactionWithDetails[];
    }> = [];

    const groupMap = new Map<string, typeof groups[0]>();

    for (const tx of transactions) {
      const txDate = new Date(tx.date);
      const dateKey = format(txDate, "yyyy-MM-dd");

      let group = groupMap.get(dateKey);
      if (!group) {
        const today = isToday(txDate);
        const yesterday = isYesterday(txDate);
        const dateLabel = format(txDate, "EEEE, dd MMMM yyyy", { locale: localeId });

        group = {
          dateKey,
          dateLabel,
          isToday: today,
          isYesterday: yesterday,
          totalIncome: 0,
          totalExpense: 0,
          items: [],
        };
        groupMap.set(dateKey, group);
        groups.push(group);
      }

      group.items.push(tx);

      // Pengecualian transfer dari total arus kas harian
      const amount = Number(tx.amount);
      if (tx.type === "INCOME") {
        group.totalIncome += amount;
      } else if (tx.type === "EXPENSE") {
        group.totalExpense += amount;
      }
    }

    return groups;
  }, [transactions]);

  const toggleDate = (dateKey: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateKey)) {
        next.delete(dateKey);
      } else {
        next.add(dateKey);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    setExpandedDates(new Set(groupedTransactions.map((g) => g.dateKey)));
  };

  const handleCollapseAll = () => {
    setExpandedDates(new Set());
  };

  const allExpanded =
    groupedTransactions.length > 0 &&
    groupedTransactions.every((g) => expandedDates.has(g.dateKey));

  const handleReset = () => {
    setSearch("");
    setType("");
    setAccountId("");
    setCategoryId("");
    setMinAmount("");
    setMaxAmount("");
    setIsAllTime(true);
    setCurrentDate(new Date());
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus transaksi ini? Saldo rekening akan disesuaikan kembali.")) {
      await deleteTransaction(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Riwayat Transaksi</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Daftar seluruh aktivitas arus kas rekening Anda.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isAllTime && (
            <div className="flex items-center gap-1 bg-zinc-50 border border-zinc-200 rounded-md p-1">
              <button
                onClick={handlePrevMonth}
                className="p-1 rounded text-zinc-600 hover:text-zinc-950 hover:bg-white transition-colors cursor-pointer"
                aria-label="Bulan Sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2.5 text-xs font-semibold text-zinc-900 capitalize tabular-nums">
                {monthName}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1 rounded text-zinc-600 hover:text-zinc-950 hover:bg-white transition-colors cursor-pointer"
                aria-label="Bulan Berikutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Toggle Semua Waktu vs Per Bulan */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAllTime((prev) => !prev)}
            className="h-8 text-xs border-zinc-200 shadow-none font-medium cursor-pointer bg-white text-zinc-700 hover:bg-zinc-100"
          >
            {isAllTime ? "Filter Per Bulan" : "Tampilkan Semua"}
          </Button>

          {isDriver && (
            <Button
              onClick={() => setIsDriverModalOpen(true)}
              variant="outline"
              className="h-8 text-xs flex items-center gap-1.5 border-zinc-200 hover:bg-zinc-100 text-zinc-950 font-medium"
            >
              <Bike className="h-4 w-4" />
              <span>Order Driver (COD)</span>
            </Button>
          )}
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
          <Select
            value={type}
            onChange={(e) => setType(e.target.value as "INCOME" | "EXPENSE" | "TRANSFER" | "")}
            wrapperClassName="w-auto min-w-[150px]"
            className="h-9 text-xs"
          >
            <option value="">Semua Tipe Transaksi</option>
            <option value="EXPENSE">Pengeluaran</option>
            <option value="INCOME">Pemasukan</option>
            <option value="TRANSFER">Transfer</option>
          </Select>

          {/* Account dropdown */}
          <Select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            wrapperClassName="w-auto min-w-[150px]"
            className="h-9 text-xs"
          >
            <option value="">Semua Rekening</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </Select>

          {/* Category dropdown */}
          <Select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            wrapperClassName="w-auto min-w-[150px]"
            className="h-9 text-xs"
          >
            <option value="">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.type === "INCOME" ? "Masuk" : "Keluar"})
              </option>
            ))}
          </Select>
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

      {/* Summary Info Bar for active filter list */}
      {!isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card className="p-3 bg-white border border-zinc-200 shadow-none">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[11px] text-zinc-500 block truncate">Total Pemasukan</span>
              <span className="text-[10px] text-zinc-400 capitalize truncate">
                {isAllTime ? "Semua Waktu" : monthName}
              </span>
            </div>
            <span className="text-base font-bold text-emerald-700 tabular-nums">
              +{formatRupiah(totalFilteredIncome)}
            </span>
          </Card>
          <Card className="p-3 bg-white border border-zinc-200 shadow-none">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[11px] text-zinc-500 block truncate">Total Pengeluaran</span>
              <span className="text-[10px] text-zinc-400 capitalize truncate">
                {isAllTime ? "Semua Waktu" : monthName}
              </span>
            </div>
            <span className="text-base font-bold text-red-700 tabular-nums">
              -{formatRupiah(totalFilteredExpense)}
            </span>
          </Card>
          <Card className="p-3 bg-white border border-zinc-200 shadow-none col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[11px] text-zinc-500 block truncate">Arus Bersih</span>
              <span className="text-[10px] text-zinc-400 capitalize truncate">
                {isAllTime ? "Semua Waktu" : monthName}
              </span>
            </div>
            <span
              className={cn(
                "text-base font-bold tabular-nums",
                totalFilteredIncome - totalFilteredExpense >= 0 ? "text-zinc-950" : "text-red-700"
              )}
            >
              {totalFilteredIncome - totalFilteredExpense >= 0 ? "+" : ""}
              {formatRupiah(totalFilteredIncome - totalFilteredExpense)}
            </span>
          </Card>
        </div>
      )}

      {/* Grouped Transactions List */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : transactions.length === 0 ? (
        <Card className="p-8 text-center text-xs text-zinc-400 shadow-none border border-zinc-200">
          Tidak ada transaksi yang cocok dengan filter yang dipilih untuk periode{" "}
          <span className="font-semibold text-zinc-700">{isAllTime ? "Semua Waktu" : monthName}</span>.
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Baris kontrol ringkas: total hari & expand/collapse all */}
          <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
            <span>
              {groupedTransactions.length} hari transaksi tercatat (klik tanggal untuk rincian)
            </span>
            <button
              type="button"
              onClick={allExpanded ? handleCollapseAll : handleExpandAll}
              className="text-[11px] font-medium text-zinc-700 hover:text-zinc-950 underline underline-offset-2 cursor-pointer"
            >
              {allExpanded ? "Tutup Semua" : "Buka Semua"}
            </button>
          </div>

          {groupedTransactions.map((group) => {
            const isExpanded = expandedDates.has(group.dateKey);

            return (
              <Card key={group.dateKey} className="overflow-hidden border border-zinc-200 shadow-none">
                {/* Daily Header (Clickable Toggle) */}
                <button
                  type="button"
                  onClick={() => toggleDate(group.dateKey)}
                  aria-expanded={isExpanded}
                  className={cn(
                    "w-full bg-zinc-50 px-4 py-2.5 flex items-center justify-between gap-2 text-left cursor-pointer hover:bg-zinc-100/80 transition-colors",
                    isExpanded && "border-b border-zinc-200"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-zinc-500 shrink-0 transition-transform duration-200",
                        isExpanded && "rotate-180"
                      )}
                    />
                    <span className="font-semibold text-xs text-zinc-950 capitalize truncate">
                      {group.dateLabel}
                    </span>
                    {group.isToday && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-zinc-950 text-white rounded shrink-0">
                        Hari Ini
                      </span>
                    )}
                    {group.isYesterday && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-zinc-200 text-zinc-800 rounded shrink-0">
                        Kemarin
                      </span>
                    )}
                    <span className="text-[11px] text-zinc-400 shrink-0">
                      ({group.items.length})
                    </span>
                  </div>

                  {/* Subtotal Pemasukan & Pengeluaran Harian */}
                  <div className="flex items-center gap-3 tabular-nums text-xs font-semibold shrink-0">
                    {group.totalIncome > 0 && (
                      <span className="text-emerald-700">
                        +{formatRupiah(group.totalIncome)}
                      </span>
                    )}
                    {group.totalExpense > 0 && (
                      <span className="text-red-700">
                        -{formatRupiah(group.totalExpense)}
                      </span>
                    )}
                    {group.totalIncome === 0 && group.totalExpense === 0 && (
                      <span className="text-zinc-400 text-[11px] font-normal">Transfer Saja</span>
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white border-b border-zinc-100 text-zinc-400 font-medium uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4 w-48">Tipe / Kategori</th>
                      <th className="py-2.5 px-4">Catatan</th>
                      <th className="py-2.5 px-4 w-40">Rekening</th>
                      <th className="py-2.5 px-4 text-right w-40">Nominal</th>
                      <th className="py-2.5 px-4 text-center w-16">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {group.items.map((tx) => {
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
                        <tr key={tx.id} className="hover:bg-zinc-50/70 transition-colors">
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
                            <div className="flex items-center justify-center gap-1">
                              {!tx.parentTransferId && (
                                <button
                                  onClick={() => {
                                    setEditingTx(tx);
                                    setIsEditModalOpen(true);
                                  }}
                                  className="p-1 rounded text-zinc-400 hover:text-zinc-950 transition-colors cursor-pointer"
                                  title="Edit transaksi"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(tx.id)}
                                className="p-1 rounded text-zinc-400 hover:text-red-700 transition-colors cursor-pointer"
                                title="Hapus transaksi"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Row View */}
              <div className="md:hidden divide-y divide-zinc-100">
                {group.items.map((tx) => {
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
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <Badge variant={badgeVariant} className="text-[9px] px-1.5 py-0.5 shrink-0">
                          {tx.type === "INCOME" ? "Masuk" : tx.type === "EXPENSE" ? "Keluar" : "Transfer"}
                        </Badge>
                        <div className="min-w-0">
                          <div className="font-medium text-zinc-950 truncate">
                            {tx.type === "TRANSFER"
                              ? `${tx.account?.name} → ${tx.toAccount?.name}`
                              : tx.category?.name || "Tanpa Kategori"}
                          </div>
                          <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                            <span>{tx.account?.name}</span>
                            {tx.note && (
                              <>
                                <span>•</span>
                                <span className="text-zinc-400 truncate">{tx.note}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-right shrink-0">
                        <div>
                          <div className={`font-semibold tabular-nums text-sm ${amountColor}`}>
                            {prefix}{formatRupiah(Number(tx.amount))}
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {!tx.parentTransferId && (
                            <button
                              onClick={() => {
                                setEditingTx(tx);
                                setIsEditModalOpen(true);
                              }}
                              className="p-1 rounded text-zinc-400 hover:text-zinc-950 transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(tx.id)}
                            className="p-1 rounded text-zinc-400 hover:text-red-700 transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>
      );
    })}
  </div>
)}

      {/* Edit Modal */}
      <TransactionModal
        open={isEditModalOpen}
        onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) setEditingTx(null);
        }}
        transactionToEdit={editingTx}
      />

      {/* Driver Order Modal */}
      <DriverOrderModal
        open={isDriverModalOpen}
        onOpenChange={setIsDriverModalOpen}
      />
    </div>
  );
}

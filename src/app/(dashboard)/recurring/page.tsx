"use client";

import * as React from "react";
import { useRecurring } from "@/hooks/use-recurring";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RecurringModal } from "@/components/forms/recurring-modal";
import { formatRupiah } from "@/lib/utils";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Plus, Trash2, Repeat, Clock, Calendar } from "lucide-react";

export default function RecurringPage() {
  const [modalOpen, setModalOpen] = React.useState(false);
  const { data: items = [], isLoading, toggleActive, deleteRecurring } = useRecurring();

  const handleToggle = async (id: string, currentActive: boolean) => {
    await toggleActive({ id, isActive: !currentActive });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus jadwal transaksi berulang ini?")) {
      await deleteRecurring(id);
    }
  };

  const frequencyLabel: Record<string, string> = {
    DAILY: "Harian",
    WEEKLY: "Mingguan",
    MONTHLY: "Bulanan",
    YEARLY: "Tahunan",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Transaksi Berulang</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Jadwal transaksi otomatis via Vercel Cron untuk pos rutin Anda.
          </p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 bg-zinc-950 text-white hover:bg-zinc-800 shadow-none text-xs h-9 px-3.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Buat Jadwal Baru</span>
        </Button>
      </div>

      {/* Main List */}
      {isLoading ? (
        <Card className="p-4 space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </Card>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <div className="mx-auto w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500">
            <Repeat className="h-5 w-5" />
          </div>
          <div className="text-sm font-semibold text-zinc-950">Belum ada transaksi berulang</div>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Atur pos pengeluaran rutin seperti langganan bulanan atau gaji agar tercatat otomatis oleh sistem.
          </p>
          <Button
            onClick={() => setModalOpen(true)}
            variant="outline"
            className="text-xs h-8 mt-2 cursor-pointer"
          >
            Mulai Buat Jadwal
          </Button>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200 font-medium">
                <tr>
                  <th className="py-3 px-4">Frekuensi</th>
                  <th className="py-3 px-4">Tipe & Kategori</th>
                  <th className="py-3 px-4">Keterangan</th>
                  <th className="py-3 px-4">Rekening</th>
                  <th className="py-3 px-4">Jadwal Berikutnya</th>
                  <th className="py-3 px-4 text-right">Nominal</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {items.map((item) => {
                  const nextDate = format(new Date(item.nextRunDate), "dd MMM yyyy", {
                    locale: localeId,
                  });

                  let badgeVariant: "income" | "expense" | "transfer" = "expense";
                  let prefix = "-";
                  let amountColor = "text-red-700";

                  if (item.type === "INCOME") {
                    badgeVariant = "income";
                    prefix = "+";
                    amountColor = "text-emerald-700";
                  } else if (item.type === "TRANSFER") {
                    badgeVariant = "transfer";
                    prefix = "";
                    amountColor = "text-blue-700";
                  }

                  return (
                    <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-800 border border-zinc-200">
                          <Calendar className="h-3 w-3 text-zinc-500" />
                          {frequencyLabel[item.frequency] || item.frequency}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Badge variant={badgeVariant} className="text-[10px] px-1.5 py-0.5">
                            {item.type === "INCOME" ? "Masuk" : item.type === "EXPENSE" ? "Keluar" : "Transfer"}
                          </Badge>
                          <span className="font-medium text-zinc-950">
                            {item.type === "TRANSFER"
                              ? `${item.account?.name || "Asal"} → ${item.toAccount?.name || "Tujuan"}`
                              : item.category?.name || "Tanpa Kategori"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-zinc-600 max-w-xs truncate">
                        {item.note || "-"}
                      </td>
                      <td className="py-3 px-4 text-zinc-600 whitespace-nowrap">
                        {item.account?.name}
                      </td>
                      <td className="py-3 px-4 tabular-nums text-zinc-600 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-zinc-400" />
                          {nextDate}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-right font-semibold tabular-nums ${amountColor} whitespace-nowrap`}>
                        {prefix}{formatRupiah(Number(item.amount))}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggle(item.id, item.isActive)}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                            item.isActive
                              ? "bg-zinc-950 text-white border-zinc-950"
                              : "bg-zinc-100 text-zinc-500 border-zinc-200 hover:text-zinc-900"
                          }`}
                        >
                          {item.isActive ? "Aktif" : "Jeda"}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 rounded text-zinc-400 hover:text-red-700 transition-colors cursor-pointer"
                          title="Hapus jadwal"
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
            {items.map((item) => {
              const nextDate = format(new Date(item.nextRunDate), "dd MMM yyyy", {
                locale: localeId,
              });

              let badgeVariant: "income" | "expense" | "transfer" = "expense";
              let prefix = "-";
              let amountColor = "text-red-700";

              if (item.type === "INCOME") {
                badgeVariant = "income";
                prefix = "+";
                amountColor = "text-emerald-700";
              } else if (item.type === "TRANSFER") {
                badgeVariant = "transfer";
                prefix = "";
                amountColor = "text-blue-700";
              }

              return (
                <div key={item.id} className="p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-zinc-100 text-zinc-800 border border-zinc-200">
                        {frequencyLabel[item.frequency] || item.frequency}
                      </span>
                      <Badge variant={badgeVariant} className="text-[9px] px-1.5 py-0.5">
                        {item.type === "INCOME" ? "Masuk" : item.type === "EXPENSE" ? "Keluar" : "Transfer"}
                      </Badge>
                    </div>

                    <div className={`font-semibold tabular-nums text-sm ${amountColor}`}>
                      {prefix}{formatRupiah(Number(item.amount))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-zinc-950">
                        {item.type === "TRANSFER"
                          ? `${item.account?.name} → ${item.toAccount?.name}`
                          : item.category?.name || "Tanpa Kategori"}
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        {item.account?.name} • Berikutnya: <span className="tabular-nums">{nextDate}</span>
                      </div>
                      {item.note && <div className="text-[11px] text-zinc-400 mt-0.5">{item.note}</div>}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggle(item.id, item.isActive)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                          item.isActive
                            ? "bg-zinc-950 text-white border-zinc-950"
                            : "bg-zinc-100 text-zinc-500 border-zinc-200"
                        }`}
                      >
                        {item.isActive ? "Aktif" : "Jeda"}
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
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
        </Card>
      )}

      {/* Modal Buat Jadwal */}
      <RecurringModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}

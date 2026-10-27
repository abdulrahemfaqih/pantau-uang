"use client";

import * as React from "react";
import { useDebts, DebtWithPayments } from "@/hooks/use-debts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DebtModal } from "@/components/forms/debt-modal";
import { DebtPaymentModal } from "@/components/forms/debt-payment-modal";
import { formatRupiah, cn } from "@/lib/utils";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Plus, Trash2, ArrowDownLeft, ArrowUpRight, Calendar, HandCoins } from "lucide-react";

type FilterTab = "ALL" | "DEBT" | "LOAN" | "UNPAID" | "PAID";

export default function DebtsPage() {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [payingDebt, setPayingDebt] = React.useState<DebtWithPayments | null>(null);
  const [activeTab, setActiveTab] = React.useState<FilterTab>("ALL");

  const { data, isLoading, deleteDebt } = useDebts();
  const debts = React.useMemo(() => data?.debts || [], [data?.debts]);
  const summary = data?.summary || { totalDebt: 0, totalLoan: 0 };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus catatan hutang/piutang ini beserta riwayat pembayarannya?")) {
      await deleteDebt(id);
    }
  };

  const filteredDebts = React.useMemo(() => {
    return debts.filter((d) => {
      if (activeTab === "DEBT") return d.type === "DEBT";
      if (activeTab === "LOAN") return d.type === "LOAN";
      if (activeTab === "UNPAID") return d.status !== "PAID";
      if (activeTab === "PAID") return d.status === "PAID";
      return true;
    });
  }, [debts, activeTab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Hutang & Piutang</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Pantau kewajiban hutang dan pencatatan penagihan piutang Anda.
          </p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 bg-zinc-950 text-white hover:bg-zinc-800 shadow-none text-xs h-9 px-3.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Catatan</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-4 border border-zinc-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Total Hutang Saya (Kewajiban)</span>
            <span className="p-1.5 rounded bg-zinc-100 text-zinc-700">
              <ArrowDownLeft className="h-4 w-4 text-red-700" />
            </span>
          </div>
          <div className="text-2xl font-bold text-zinc-950 tabular-nums">
            {formatRupiah(summary.totalDebt)}
          </div>
          <p className="text-[11px] text-zinc-400">
            Sisa kewajiban yang masih harus dibayarkan ke pihak lain.
          </p>
        </Card>

        <Card className="p-4 border border-zinc-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Total Piutang Saya (Hak Tagih)</span>
            <span className="p-1.5 rounded bg-zinc-100 text-zinc-700">
              <ArrowUpRight className="h-4 w-4 text-emerald-700" />
            </span>
          </div>
          <div className="text-2xl font-bold text-zinc-950 tabular-nums">
            {formatRupiah(summary.totalLoan)}
          </div>
          <p className="text-[11px] text-zinc-400">
            Sisa uang yang masih harus ditagih dari pihak lain.
          </p>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1 p-1 bg-zinc-100 rounded-md border border-zinc-200 text-xs font-medium w-fit">
        <button
          onClick={() => setActiveTab("ALL")}
          className={cn(
            "px-3 py-1.5 rounded transition-colors cursor-pointer",
            activeTab === "ALL"
              ? "bg-white text-zinc-950 font-semibold border border-zinc-200 shadow-none"
              : "text-zinc-600 hover:text-zinc-950"
          )}
        >
          Semua ({debts.length})
        </button>
        <button
          onClick={() => setActiveTab("DEBT")}
          className={cn(
            "px-3 py-1.5 rounded transition-colors cursor-pointer",
            activeTab === "DEBT"
              ? "bg-white text-zinc-950 font-semibold border border-zinc-200 shadow-none"
              : "text-zinc-600 hover:text-zinc-950"
          )}
        >
          Hutang ({debts.filter((d) => d.type === "DEBT").length})
        </button>
        <button
          onClick={() => setActiveTab("LOAN")}
          className={cn(
            "px-3 py-1.5 rounded transition-colors cursor-pointer",
            activeTab === "LOAN"
              ? "bg-white text-zinc-950 font-semibold border border-zinc-200 shadow-none"
              : "text-zinc-600 hover:text-zinc-950"
          )}
        >
          Piutang ({debts.filter((d) => d.type === "LOAN").length})
        </button>
        <button
          onClick={() => setActiveTab("UNPAID")}
          className={cn(
            "px-3 py-1.5 rounded transition-colors cursor-pointer",
            activeTab === "UNPAID"
              ? "bg-white text-zinc-950 font-semibold border border-zinc-200 shadow-none"
              : "text-zinc-600 hover:text-zinc-950"
          )}
        >
          Belum Lunas ({debts.filter((d) => d.status !== "PAID").length})
        </button>
        <button
          onClick={() => setActiveTab("PAID")}
          className={cn(
            "px-3 py-1.5 rounded transition-colors cursor-pointer",
            activeTab === "PAID"
              ? "bg-white text-zinc-950 font-semibold border border-zinc-200 shadow-none"
              : "text-zinc-600 hover:text-zinc-950"
          )}
        >
          Lunas ({debts.filter((d) => d.status === "PAID").length})
        </button>
      </div>

      {/* Main List */}
      {isLoading ? (
        <Card className="p-4 space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </Card>
      ) : filteredDebts.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <div className="mx-auto w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500">
            <HandCoins className="h-5 w-5" />
          </div>
          <div className="text-sm font-semibold text-zinc-950">Belum ada catatan hutang atau piutang</div>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Catat pinjaman atau piutang agar pembayaran bertahap dan jatuh tempo dapat terpantau dengan jelas.
          </p>
          <Button
            onClick={() => setModalOpen(true)}
            variant="outline"
            className="text-xs h-8 mt-2 cursor-pointer"
          >
            Mulai Catat
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDebts.map((item) => {
            const isDebt = item.type === "DEBT";
            const initialAmt = Number(item.amount);
            const remainingAmt = Number(item.remainingAmount);
            const paidAmt = initialAmt - remainingAmt;
            const percentage = initialAmt > 0 ? Math.min(100, Math.round((paidAmt / initialAmt) * 100)) : 0;

            const dueDateFormatted = item.dueDate
              ? format(new Date(item.dueDate), "dd MMM yyyy", { locale: localeId })
              : null;

            return (
              <Card key={item.id} className="p-4 space-y-3.5 border border-zinc-200 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-semibold border",
                            isDebt
                              ? "bg-red-50 text-red-800 border-red-200"
                              : "bg-emerald-50 text-emerald-800 border-emerald-200"
                          )}
                        >
                          {isDebt ? "Hutang" : "Piutang"}
                        </span>
                        <h2 className="font-bold text-zinc-950 text-sm">{item.personName}</h2>
                      </div>
                      {item.note && (
                        <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{item.note}</p>
                      )}
                    </div>

                    <Badge
                      variant={
                        item.status === "PAID"
                          ? "income"
                          : item.status === "PARTIAL"
                          ? "transfer"
                          : "secondary"
                      }
                      className="text-[10px] shrink-0"
                    >
                      {item.status === "PAID"
                        ? "Lunas"
                        : item.status === "PARTIAL"
                        ? "Sebagian"
                        : "Belum Bayar"}
                    </Badge>
                  </div>

                  {/* Nominal Info */}
                  <div className="pt-2 flex items-baseline justify-between text-xs">
                    <div>
                      <span className="text-zinc-500 text-[11px]">Sisa Tagihan:</span>
                      <div className="text-base font-bold tabular-nums text-zinc-950">
                        {formatRupiah(remainingAmt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-zinc-400 text-[11px]">Total Awal:</span>
                      <div className="text-xs text-zinc-600 tabular-nums">
                        {formatRupiah(initialAmt)}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-zinc-950 h-full rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-400 tabular-nums">
                      <span>Terbayar: {percentage}% ({formatRupiah(paidAmt)})</span>
                      {dueDateFormatted && (
                        <span className="flex items-center gap-1 text-zinc-500">
                          <Calendar className="h-2.5 w-2.5" />
                          Tempo: {dueDateFormatted}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Payment History snippet */}
                  {item.payments && item.payments.length > 0 && (
                    <div className="pt-2 border-t border-zinc-100 text-[11px] text-zinc-500 space-y-1">
                      <div className="font-medium text-zinc-700">Riwayat Pembayaran ({item.payments.length}):</div>
                      <div className="max-h-20 overflow-y-auto space-y-1 pr-1">
                        {item.payments.map((p) => (
                          <div key={p.id} className="flex justify-between tabular-nums text-[10px] text-zinc-600">
                            <span>{format(new Date(p.date), "dd/MM/yy")} {p.note ? `• ${p.note}` : ""}</span>
                            <span className="font-medium text-zinc-900">+{formatRupiah(Number(p.amount))}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded text-zinc-400 hover:text-red-700 transition-colors cursor-pointer"
                    title="Hapus catatan"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  {item.status !== "PAID" && (
                    <Button
                      onClick={() => setPayingDebt(item)}
                      variant="outline"
                      className="text-xs h-8 px-3 text-zinc-950 hover:bg-zinc-100 border-zinc-300 font-medium cursor-pointer"
                    >
                      {isDebt ? "Bayar / Cicil" : "Catat Penerimaan"}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Tambah Hutang/Piutang */}
      <DebtModal open={modalOpen} onOpenChange={setModalOpen} />

      {/* Modal Catat Pembayaran */}
      <DebtPaymentModal
        open={Boolean(payingDebt)}
        onOpenChange={(open) => {
          if (!open) setPayingDebt(null);
        }}
        debt={payingDebt}
      />
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSavings, useSavingsDetail, SavingsTransactionWithDetails } from "@/hooks/use-savings";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SavingsActionModal } from "@/components/forms/savings-action-modal";
import { SavingsYieldModal } from "@/components/forms/savings-yield-modal";
import { formatRupiah, cn } from "@/lib/utils";
import {
  ArrowLeft,
  PiggyBank,
  Heart,
  Plane,
  Laptop,
  Home,
  Car,
  ShieldCheck,
  GraduationCap,
  Gift,
  Calendar,
  Users2,
  Trash2,
  Copy,
  Check,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Clock,
  User,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const ICON_MAP: Record<string, React.ElementType> = {
  PiggyBank,
  Heart,
  Plane,
  Laptop,
  Home,
  Car,
  ShieldCheck,
  GraduationCap,
  Gift,
};

type TxFilter = "ALL" | "MY" | "DEPOSIT" | "WITHDRAW" | "YIELD";

export default function SavingsDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id as string;

  const { data: goal, isLoading, error } = useSavingsDetail(id);
  const { deleteGoal, isDeleting } = useSavings();

  const [activeTab, setActiveTab] = React.useState<TxFilter>("ALL");
  const [actionModalOpen, setActionModalOpen] = React.useState(false);
  const [actionType, setActionType] = React.useState<"DEPOSIT" | "WITHDRAW">("DEPOSIT");
  const [yieldModalOpen, setYieldModalOpen] = React.useState(false);
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

  const handleCopyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  const handleOpenAction = (type: "DEPOSIT" | "WITHDRAW") => {
    setActionType(type);
    setActionModalOpen(true);
  };

  const handleDelete = async () => {
    if (!goal) return;
    const confirmText = goal.isOwner
      ? `Hapus target tabungan "${goal.name}"? Seluruh riwayat transaksi tabungan ini akan dihapus secara permanen.`
      : `Keluar dari tabungan bersama "${goal.name}"?`;

    if (confirm(confirmText)) {
      await deleteGoal(goal.id);
      router.push("/savings");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 bg-zinc-200 rounded animate-pulse" />
        <Skeleton className="h-28 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !goal) {
    return (
      <div className="space-y-4">
        <Link
          href="/savings"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-950 font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Daftar Tabungan</span>
        </Link>
        <Card className="p-8 text-center border border-zinc-200 shadow-none">
          <p className="text-sm font-medium text-zinc-950">Tabungan tidak ditemukan atau Anda tidak memiliki akses.</p>
        </Card>
      </div>
    );
  }

  const IconComp = ICON_MAP[goal.icon] || PiggyBank;
  const currentAmt = Number(goal.currentAmount || 0);
  const targetAmt = Number(goal.targetAmount || 0);
  const principalAmt = Number(goal.principalAmount ?? currentAmt);
  const totalYield = Number(goal.totalYieldEarned || 0);
  const remainingAmt = Math.max(0, targetAmt - currentAmt);
  const isCompleted = currentAmt >= targetAmt;

  const targetDateFormatted = goal.targetDate
    ? format(new Date(goal.targetDate), "dd MMMM yyyy", { locale: localeId })
    : null;

  const allTransactions: SavingsTransactionWithDetails[] = goal.transactions || [];

  const filteredTransactions = allTransactions.filter((tx) => {
    if (activeTab === "MY") return tx.userId === goal.currentUserId;
    if (activeTab === "DEPOSIT") return tx.type === "DEPOSIT";
    if (activeTab === "WITHDRAW") return tx.type === "WITHDRAW";
    if (activeTab === "YIELD") return tx.type === "YIELD";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Back Nav */}
      <div>
        <Link
          href="/savings"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-950 font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Daftar Tabungan</span>
        </Link>
      </div>

      {/* Main Header Card */}
      <Card className="p-5 sm:p-6 border border-zinc-200 shadow-none space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Identity */}
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div
              className="h-12 w-12 rounded-md flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: goal.color }}
            >
              <IconComp className="h-6 w-6" />
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-zinc-950 truncate">
                  {goal.name}
                </h1>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded text-[11px] font-semibold border shrink-0",
                    goal.isShared
                      ? "bg-blue-50 text-blue-800 border-blue-200"
                      : "bg-zinc-100 text-zinc-800 border-zinc-200"
                  )}
                >
                  {goal.isShared ? "Tabungan Bersama" : "Tabungan Mandiri"}
                </span>
                {goal.hasYield && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold border shrink-0 bg-emerald-50 text-emerald-800 border-emerald-200 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>RDPU / Berimbal Hasil</span>
                  </span>
                )}
                {goal.isOwner ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold border shrink-0 bg-zinc-950 text-white border-zinc-950">
                    Owner
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold border shrink-0 bg-zinc-100 text-zinc-700 border-zinc-200">
                    Anggota
                  </span>
                )}
              </div>

              {/* Subtitle / Notes */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                {goal.yieldNote && (
                  <span className="font-medium text-zinc-700">
                    Instrumen: {goal.yieldNote}
                  </span>
                )}
                {goal.yieldNote && targetDateFormatted && <span>•</span>}
                {targetDateFormatted && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Target: {targetDateFormatted}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            {goal.isShared && goal.inviteCode && (
              <button
                onClick={() => handleCopyInviteCode(goal.inviteCode!)}
                className="px-2.5 py-1.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-mono font-medium border border-zinc-200 flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
                title="Klik untuk menyalin kode undangan"
              >
                {copiedCode === goal.inviteCode ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-zinc-500" />
                    <span>{goal.inviteCode}</span>
                  </>
                )}
              </button>
            )}

            {goal.hasYield && (
              <Button
                onClick={() => setYieldModalOpen(true)}
                variant="outline"
                className="text-xs h-9 px-3 text-emerald-700 border-emerald-300 hover:bg-emerald-50 shadow-none font-medium gap-1.5"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Update Nilai</span>
              </Button>
            )}

            {goal.myContribution > 0 && (
              <Button
                onClick={() => handleOpenAction("WITHDRAW")}
                variant="outline"
                className="text-xs h-9 px-3 text-zinc-950 border-zinc-300 hover:bg-zinc-100 shadow-none font-medium gap-1.5"
              >
                <ArrowDownLeft className="h-3.5 w-3.5 text-zinc-600" />
                <span>Tarik Dana</span>
              </Button>
            )}

            <Button
              onClick={() => handleOpenAction("DEPOSIT")}
              className="text-xs h-9 px-3.5 bg-zinc-950 text-white hover:bg-zinc-800 shadow-none font-medium gap-1.5"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>Setor Dana</span>
            </Button>

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 rounded text-zinc-400 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer border border-transparent hover:border-red-200 ml-1"
              title={goal.isOwner ? "Hapus tabungan" : "Keluar dari tabungan"}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* 4 Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Terkumpul */}
        <Card className="p-4 border border-zinc-200 shadow-none space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Total Saldo Terkumpul</span>
            <span className="p-1 rounded bg-zinc-100 text-zinc-700">
              <PiggyBank className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl font-bold tabular-nums text-zinc-950">
            {formatRupiah(currentAmt)}
          </div>
          <div className="space-y-1 pt-1">
            <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  isCompleted ? "bg-emerald-600" : "bg-zinc-950"
                )}
                style={{ width: `${goal.percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-zinc-500 tabular-nums">
              <span>{goal.percentage}% dari {formatRupiah(targetAmt)}</span>
              <span>{isCompleted ? "Tercapai!" : `Sisa ${formatRupiah(remainingAmt)}`}</span>
            </div>
          </div>
        </Card>

        {/* Card 2: Modal Pokok */}
        <Card className="p-4 border border-zinc-200 shadow-none space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Modal Pokok Disetor</span>
            <span className="p-1 rounded bg-zinc-100 text-zinc-700">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl font-bold tabular-nums text-zinc-950">
            {formatRupiah(principalAmt)}
          </div>
          <p className="text-[11px] text-zinc-400">
            Akumulasi setoran modal murni tanpa imbal hasil.
          </p>
        </Card>

        {/* Card 3: Total Imbal Hasil / Status */}
        {goal.hasYield ? (
          <Card className="p-4 border border-zinc-200 shadow-none space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500">Total Imbal Hasil</span>
              <span className="p-1 rounded bg-emerald-50 text-emerald-700">
                <TrendingUp className="h-4 w-4" />
              </span>
            </div>
            <div className="text-2xl font-bold tabular-nums text-emerald-700">
              +{formatRupiah(totalYield)}
            </div>
            <p className="text-[11px] text-zinc-400">
              Keuntungan / bunga investasi yang tercatat.
            </p>
          </Card>
        ) : (
          <Card className="p-4 border border-zinc-200 shadow-none space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500">Status Pencapaian</span>
              <span className="p-1 rounded bg-zinc-100 text-zinc-700">
                <Check className="h-4 w-4" />
              </span>
            </div>
            <div className="text-2xl font-bold tabular-nums text-zinc-950">
              {goal.percentage}%
            </div>
            <p className="text-[11px] text-zinc-400">
              {isCompleted ? "Target telah berhasil dicapai." : "Sedang aktif berjalan."}
            </p>
          </Card>
        )}

        {/* Card 4: Porsi Kontribusi Saya */}
        <Card className="p-4 border border-zinc-200 shadow-none space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Kontribusi Pribadi Anda</span>
            <span className="p-1 rounded bg-zinc-100 text-zinc-700">
              <User className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl font-bold tabular-nums text-emerald-700">
            {formatRupiah(goal.myContribution)}
          </div>
          <p className="text-[11px] text-zinc-400">
            Saldo yang tersimpan di rekening pribadi Anda.
          </p>
        </Card>
      </div>

      {/* Shared Members Section */}
      {goal.isShared && goal.members && goal.members.length > 0 && (
        <Card className="p-5 border border-zinc-200 shadow-none space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2">
              <Users2 className="h-4 w-4 text-zinc-700" />
              <h2 className="text-sm font-bold text-zinc-950">
                Anggota Tabungan Bersama ({goal.membersCount})
              </h2>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-zinc-400">
              <Info className="h-3.5 w-3.5" />
              <span>Uang fisik tetap tersimpan aman di rekening masing-masing anggota</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {goal.members.map((m) => (
              <div
                key={m.id}
                className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-md flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-zinc-200 text-zinc-800 flex items-center justify-center font-bold text-xs shrink-0">
                    {m.user?.name ? m.user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-zinc-950 truncate">
                        {m.user?.name || "Pengguna"}
                      </span>
                      {m.role === "OWNER" && (
                        <span className="px-1 text-[9px] bg-zinc-200 text-zinc-700 rounded font-normal shrink-0">
                          Owner
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-400 block truncate">
                      {m.user?.email || "Anggota"}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold tabular-nums text-zinc-950">
                    {formatRupiah(m.contributionAmount)}
                  </div>
                  <span className="text-[10px] text-zinc-400 tabular-nums">
                    {m.contributionPercentage}% dari total
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Transaction History Section */}
      <Card className="p-5 border border-zinc-200 shadow-none space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-zinc-950">
              Riwayat Transaksi Tabungan
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Seluruh mutasi setoran, penarikan, dan keuntungan yang tercatat.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-1 p-1 bg-zinc-100 rounded-md border border-zinc-200 text-xs font-medium self-start sm:self-auto">
            <button
              onClick={() => setActiveTab("ALL")}
              className={cn(
                "px-2.5 py-1 rounded transition-colors cursor-pointer",
                activeTab === "ALL"
                  ? "bg-white text-zinc-950 font-semibold border border-zinc-200 shadow-none"
                  : "text-zinc-600 hover:text-zinc-950"
              )}
            >
              Semua ({allTransactions.length})
            </button>
            {goal.isShared && (
              <button
                onClick={() => setActiveTab("MY")}
                className={cn(
                  "px-2.5 py-1 rounded transition-colors cursor-pointer",
                  activeTab === "MY"
                    ? "bg-white text-zinc-950 font-semibold border border-zinc-200 shadow-none"
                    : "text-zinc-600 hover:text-zinc-950"
                )}
              >
                Transaksi Saya ({allTransactions.filter((t) => t.userId === goal.currentUserId).length})
              </button>
            )}
            <button
              onClick={() => setActiveTab("DEPOSIT")}
              className={cn(
                "px-2.5 py-1 rounded transition-colors cursor-pointer",
                activeTab === "DEPOSIT"
                  ? "bg-white text-zinc-950 font-semibold border border-zinc-200 shadow-none"
                  : "text-zinc-600 hover:text-zinc-950"
              )}
            >
              Setor ({allTransactions.filter((t) => t.type === "DEPOSIT").length})
            </button>
            <button
              onClick={() => setActiveTab("WITHDRAW")}
              className={cn(
                "px-2.5 py-1 rounded transition-colors cursor-pointer",
                activeTab === "WITHDRAW"
                  ? "bg-white text-zinc-950 font-semibold border border-zinc-200 shadow-none"
                  : "text-zinc-600 hover:text-zinc-950"
              )}
            >
              Tarik ({allTransactions.filter((t) => t.type === "WITHDRAW").length})
            </button>
            {goal.hasYield && (
              <button
                onClick={() => setActiveTab("YIELD")}
                className={cn(
                  "px-2.5 py-1 rounded transition-colors cursor-pointer",
                  activeTab === "YIELD"
                    ? "bg-white text-emerald-800 font-semibold border border-zinc-200 shadow-none"
                    : "text-zinc-600 hover:text-zinc-950"
                )}
              >
                Imbal Hasil ({allTransactions.filter((t) => t.type === "YIELD").length})
              </button>
            )}
          </div>
        </div>

        {/* Transaction Items */}
        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-xs text-zinc-400">Belum ada riwayat transaksi pada filter ini.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTransactions.map((tx) => {
              const txDateFormatted = format(new Date(tx.date), "dd MMM yyyy", { locale: localeId });
              const isDeposit = tx.type === "DEPOSIT";
              const isYield = tx.type === "YIELD";
              const isMyTx = tx.userId === goal.currentUserId;

              return (
                <div
                  key={tx.id}
                  className="p-3 bg-zinc-50 border border-zinc-200 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "h-8 w-8 rounded flex items-center justify-center shrink-0 border",
                        isYield
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : isDeposit
                          ? "bg-zinc-100 text-zinc-700 border-zinc-200"
                          : "bg-zinc-100 text-zinc-700 border-zinc-200"
                      )}
                    >
                      {isYield ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : isDeposit ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownLeft className="h-4 w-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-xs text-zinc-950 truncate">
                          {tx.user?.name || "Anggota"}
                          {isMyTx && <span className="font-normal text-zinc-500 ml-1">(Anda)</span>}
                        </span>
                        <span
                          className={cn(
                            "px-1.5 py-0.2 rounded text-[10px] font-semibold border",
                            isYield
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-zinc-100 text-zinc-700 border-zinc-200"
                          )}
                        >
                          {isYield ? "Imbal Hasil" : isDeposit ? "Setor Dana" : "Tarik Dana"}
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          {txDateFormatted}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5 flex-wrap">
                        {tx.note && <span>{tx.note}</span>}
                        {tx.note && (tx.fromAccount || tx.toAccount) && <span>•</span>}
                        {tx.fromAccount && (
                          <span>Rekening: {tx.fromAccount.name}</span>
                        )}
                        {tx.toAccount && !tx.fromAccount && (
                          <span>Rekening: {tx.toAccount.name}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right sm:self-auto self-end shrink-0">
                    <span
                      className={cn(
                        "text-sm font-bold tabular-nums block",
                        isDeposit || isYield ? "text-emerald-700" : "text-zinc-900"
                      )}
                    >
                      {isDeposit || isYield ? "+" : "-"}
                      {formatRupiah(Number(tx.amount))}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modals */}
      <SavingsActionModal
        open={actionModalOpen}
        onOpenChange={setActionModalOpen}
        goal={goal}
        initialType={actionType}
      />

      <SavingsYieldModal
        open={yieldModalOpen}
        onOpenChange={setYieldModalOpen}
        goal={goal}
      />
    </div>
  );
}


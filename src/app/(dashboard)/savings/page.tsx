"use client";

import * as React from "react";
import { useSavings, SavingsGoalWithDetails } from "@/hooks/use-savings";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SavingsModal } from "@/components/forms/savings-modal";
import { SavingsActionModal } from "@/components/forms/savings-action-modal";
import { SavingsYieldModal } from "@/components/forms/savings-yield-modal";
import { SavingsJoinModal } from "@/components/forms/savings-join-modal";
import { formatRupiah, cn } from "@/lib/utils";
import {
  Plus,
  PiggyBank,
  Heart,
  Plane,
  Laptop,
  Home,
  Car,
  ShieldCheck,
  GraduationCap,
  Gift,
  Users2,
  Calendar,
  Trash2,
  Copy,
  Check,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
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

export default function SavingsPage() {
  const { data, isLoading, deleteGoal } = useSavings();

  const [activeTab, setActiveTab] = React.useState<"ALL" | "INDIVIDUAL" | "SHARED">("ALL");
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [joinModalOpen, setJoinModalOpen] = React.useState(false);

  const [activeGoal, setActiveGoal] = React.useState<SavingsGoalWithDetails | null>(null);
  const [actionType, setActionType] = React.useState<"DEPOSIT" | "WITHDRAW">("DEPOSIT");
  const [actionModalOpen, setActionModalOpen] = React.useState(false);

  const [yieldModalOpen, setYieldModalOpen] = React.useState(false);
  const [yieldGoal, setYieldGoal] = React.useState<SavingsGoalWithDetails | null>(null);

  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

  const savings = data?.savings || [];
  const summary = data?.summary || { totalSaved: 0, myTotalSaved: 0, activeGoalsCount: 0 };

  const filteredSavings = savings.filter((item) => {
    if (activeTab === "INDIVIDUAL") return !item.isShared;
    if (activeTab === "SHARED") return item.isShared;
    return true;
  });

  const handleCopyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  const handleOpenAction = (goal: SavingsGoalWithDetails, type: "DEPOSIT" | "WITHDRAW") => {
    setActiveGoal(goal);
    setActionType(type);
    setActionModalOpen(true);
  };

  const handleOpenYield = (goal: SavingsGoalWithDetails) => {
    setYieldGoal(goal);
    setYieldModalOpen(true);
  };

  const handleDelete = async (goal: SavingsGoalWithDetails) => {
    const confirmText = goal.isOwner
      ? `Hapus target tabungan "${goal.name}"? Seluruh riwayat transaksi tabungan ini akan dihapus.`
      : `Keluar dari tabungan bersama "${goal.name}"?`;

    if (confirm(confirmText)) {
      await deleteGoal(goal.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">
            Tabungan & Target Impian
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Sisihkan dana ke kantong tabungan mandiri atau pantau progres bersama secara transparan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setJoinModalOpen(true)}
            variant="outline"
            className="text-xs h-9 gap-1.5 border-zinc-200 text-zinc-950 hover:bg-zinc-100 shadow-none"
          >
            <Users2 className="h-3.5 w-3.5" />
            <span>Gabung Bersama</span>
          </Button>
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="text-xs h-9 gap-1.5 bg-zinc-950 text-white hover:bg-zinc-800 shadow-none"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Buat Tabungan</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="p-4 border border-zinc-200 shadow-none space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Total Seluruh Tabungan</span>
            <span className="p-1.5 rounded bg-zinc-100 text-zinc-700">
              <PiggyBank className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-zinc-950 tabular-nums">
            {formatRupiah(summary.totalSaved)}
          </div>
          <p className="text-[11px] text-zinc-400">
            Akumulasi seluruh tabungan aktif (mandiri dan bersama).
          </p>
        </Card>

        <Card className="p-4 border border-zinc-200 shadow-none space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Porsi Tabungan Anda</span>
            <span className="p-1.5 rounded bg-zinc-100 text-zinc-700">
              <TrendingUp className="h-4 w-4 text-emerald-700" />
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-700 tabular-nums">
            {formatRupiah(summary.myTotalSaved)}
          </div>
          <p className="text-[11px] text-zinc-400">
            Uang fisik yang mengendap di rekening pribadi Anda.
          </p>
        </Card>

        <Card className="p-4 border border-zinc-200 shadow-none space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Target Tabungan Aktif</span>
            <span className="p-1.5 rounded bg-zinc-100 text-zinc-700">
              <Calendar className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-zinc-950 tabular-nums">
            {summary.activeGoalsCount} Target
          </div>
          <p className="text-[11px] text-zinc-400">
            Target finansial yang sedang berjalan.
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
          Semua ({savings.length})
        </button>
        <button
          onClick={() => setActiveTab("INDIVIDUAL")}
          className={cn(
            "px-3 py-1.5 rounded transition-colors cursor-pointer",
            activeTab === "INDIVIDUAL"
              ? "bg-white text-zinc-950 font-semibold border border-zinc-200 shadow-none"
              : "text-zinc-600 hover:text-zinc-950"
          )}
        >
          Mandiri ({savings.filter((s) => !s.isShared).length})
        </button>
        <button
          onClick={() => setActiveTab("SHARED")}
          className={cn(
            "px-3 py-1.5 rounded transition-colors cursor-pointer",
            activeTab === "SHARED"
              ? "bg-white text-zinc-950 font-semibold border border-zinc-200 shadow-none"
              : "text-zinc-600 hover:text-zinc-950"
          )}
        >
          Bersama ({savings.filter((s) => s.isShared).length})
        </button>
      </div>

      {/* Main List Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      ) : filteredSavings.length === 0 ? (
        <Card className="p-12 text-center border border-zinc-200 shadow-none">
          <div className="inline-flex p-3 rounded-full bg-zinc-100 text-zinc-600 mb-3">
            <PiggyBank className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-950">Belum Ada Target Tabungan</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 mb-4">
            Mulai rencanakan tujuan keuangan Anda atau buat tabungan bersama pasangan dan keluarga.
          </p>
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="text-xs h-9 bg-zinc-950 text-white hover:bg-zinc-800 shadow-none"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            <span>Mulai Menabung</span>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSavings.map((goal) => {
            const IconComp = ICON_MAP[goal.icon] || PiggyBank;
            const targetAmt = Number(goal.targetAmount);
            const currentAmt = Number(goal.currentAmount);
            const remainingAmt = Math.max(0, targetAmt - currentAmt);
            const isCompleted = currentAmt >= targetAmt;

            const targetDateFormatted = goal.targetDate
              ? format(new Date(goal.targetDate), "dd MMMM yyyy", { locale: localeId })
              : null;

            return (
              <Card
                key={goal.id}
                className="p-4 sm:p-5 border border-zinc-200 shadow-none flex flex-col justify-between space-y-4"
              >
                <div className="space-y-4">
                  {/* Top Bar: Icon, Name, Type Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="h-10 w-10 rounded-md flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: goal.color }}
                      >
                        <IconComp className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h2 className="font-bold text-sm sm:text-base text-zinc-950 truncate">
                            {goal.name}
                          </h2>
                          <span
                            className={cn(
                              "px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0",
                              goal.isShared
                                ? "bg-blue-50 text-blue-800 border-blue-200"
                                : "bg-zinc-100 text-zinc-800 border-zinc-200"
                            )}
                          >
                            {goal.isShared ? "Bersama" : "Mandiri"}
                          </span>
                          {goal.hasYield && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0 bg-emerald-50 text-emerald-800 border-emerald-200 flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              <span>RDPU</span>
                            </span>
                          )}
                        </div>
                        {goal.yieldNote && (
                          <div className="text-[11px] text-zinc-500 font-medium truncate mt-0.5">
                            {goal.yieldNote}
                          </div>
                        )}
                        {targetDateFormatted && (
                          <div className="flex items-center gap-1 text-[11px] text-zinc-400 mt-0.5">
                            <Calendar className="h-3 w-3" />
                            <span>Target: {targetDateFormatted}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Invite Code Badge for Shared Goals */}
                    {goal.isShared && goal.inviteCode && (
                      <button
                        onClick={() => handleCopyInviteCode(goal.inviteCode!)}
                        className="px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[10px] font-mono font-medium border border-zinc-200 flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                        title="Klik untuk menyalin kode undangan"
                      >
                        {copiedCode === goal.inviteCode ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-700">Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 text-zinc-500" />
                            <span>{goal.inviteCode}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Nominal Status & Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between text-xs">
                      <div>
                        <span className="text-[11px] text-zinc-400 block">Terkumpul:</span>
                        <div className="text-lg sm:text-xl font-bold tabular-nums text-zinc-950">
                          {formatRupiah(currentAmt)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-zinc-400 block">Target:</span>
                        <div className="text-xs sm:text-sm font-semibold tabular-nums text-zinc-600">
                          {formatRupiah(targetAmt)}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          isCompleted ? "bg-emerald-600" : "bg-zinc-950"
                        )}
                        style={{ width: `${goal.percentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] tabular-nums text-zinc-500 pt-0.5">
                      <span className="font-semibold text-zinc-950">{goal.percentage}% tercapai</span>
                      <span>
                        {isCompleted
                          ? "Target Telah Tercapai!"
                          : `Sisa ${formatRupiah(remainingAmt)}`}
                      </span>
                    </div>
                  </div>

                  {/* Stats Pokok vs Imbal Hasil jika Tabungan Berimbal Hasil */}
                  {goal.hasYield && (
                    <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-md text-[11px] flex items-center justify-between tabular-nums">
                      <div>
                        <span className="text-zinc-400 block text-[10px]">Modal Pokok:</span>
                        <span className="font-semibold text-zinc-900">
                          {formatRupiah(Number(goal.principalAmount ?? currentAmt))}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-zinc-400 block text-[10px]">Total Imbal Hasil:</span>
                        <span className="font-semibold text-emerald-700">
                          +{formatRupiah(Number(goal.totalYieldEarned || 0))}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Shared Goal Member Breakdown */}
                  {goal.isShared && goal.members && goal.members.length > 0 && (
                    <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-md space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-medium text-zinc-700">
                        <span>Kontribusi Anggota ({goal.membersCount}):</span>
                        <span className="text-zinc-500 text-[10px]">Uang di rekening masing-masing</span>
                      </div>
                      <div className="space-y-1.5">
                        {goal.members.map((m) => (
                          <div key={m.id} className="flex items-center justify-between text-[11px] tabular-nums">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-medium text-zinc-950 truncate">
                                {m.user?.name || "Pengguna"}
                              </span>
                              {m.role === "OWNER" && (
                                <span className="px-1 text-[9px] bg-zinc-200 text-zinc-700 rounded font-normal shrink-0">
                                  Owner
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 text-zinc-700">
                              <span className="font-semibold">{formatRupiah(m.contributionAmount)}</span>
                              <span className="text-[10px] text-zinc-400">({m.contributionPercentage}%)</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Activity Feed */}
                  {goal.recentTransactions && goal.recentTransactions.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-zinc-100">
                      <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                        Aktivitas Terbaru
                      </span>
                      <div className="space-y-1 text-[11px]">
                        {goal.recentTransactions.slice(0, 2).map((tx) => (
                          <div key={tx.id} className="flex items-center justify-between tabular-nums text-zinc-600">
                            <span className="truncate">
                              {tx.user?.name || "Anggota"}:{" "}
                              {tx.type === "DEPOSIT"
                                ? "Setor"
                                : tx.type === "WITHDRAW"
                                ? "Tarik"
                                : "Imbal Hasil"}
                              {tx.note ? ` (${tx.note})` : ""}
                            </span>
                            <span
                              className={cn(
                                "font-semibold shrink-0 ml-2",
                                tx.type === "DEPOSIT" || tx.type === "YIELD"
                                  ? "text-emerald-700"
                                  : "text-zinc-700"
                              )}
                            >
                              {tx.type === "DEPOSIT" || tx.type === "YIELD" ? "+" : "-"}
                              {formatRupiah(Number(tx.amount))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons Footer */}
                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleDelete(goal)}
                    className="p-2 rounded text-zinc-400 hover:text-red-700 transition-colors cursor-pointer"
                    title={goal.isOwner ? "Hapus tabungan" : "Keluar dari tabungan"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-2">
                    {goal.hasYield && (
                      <Button
                        onClick={() => handleOpenYield(goal)}
                        variant="outline"
                        className="text-xs h-8 px-2.5 sm:px-3 text-emerald-700 border-emerald-300 hover:bg-emerald-50 shadow-none font-medium gap-1"
                      >
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>Update Nilai</span>
                      </Button>
                    )}
                    {goal.myContribution > 0 && (
                      <Button
                        onClick={() => handleOpenAction(goal, "WITHDRAW")}
                        variant="outline"
                        className="text-xs h-8 px-3 text-zinc-950 border-zinc-300 hover:bg-zinc-100 shadow-none font-medium gap-1"
                      >
                        <ArrowDownLeft className="h-3.5 w-3.5 text-zinc-600" />
                        <span>Tarik</span>
                      </Button>
                    )}
                    <Button
                      onClick={() => handleOpenAction(goal, "DEPOSIT")}
                      className="text-xs h-8 px-3 bg-zinc-950 text-white hover:bg-zinc-800 shadow-none font-medium gap-1"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      <span>Setor Dana</span>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <SavingsModal open={createModalOpen} onOpenChange={setCreateModalOpen} />

      <SavingsYieldModal
        open={yieldModalOpen}
        onOpenChange={setYieldModalOpen}
        goal={yieldGoal}
      />

      <SavingsActionModal
        open={actionModalOpen}
        onOpenChange={setActionModalOpen}
        goal={activeGoal}
        initialType={actionType}
      />

      <SavingsJoinModal open={joinModalOpen} onOpenChange={setJoinModalOpen} />
    </div>
  );
}


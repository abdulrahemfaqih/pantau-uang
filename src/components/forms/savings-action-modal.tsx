"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAccounts } from "@/hooks/use-accounts";
import { useSavings, SavingsGoalWithDetails } from "@/hooks/use-savings";
import { formatRupiah, parseRupiahInput, cn } from "@/lib/utils";
import { format } from "date-fns";

interface SavingsActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: SavingsGoalWithDetails | null;
  initialType?: "DEPOSIT" | "WITHDRAW";
}

function SavingsActionForm({
  goal,
  initialType = "DEPOSIT",
  onClose,
}: {
  goal: SavingsGoalWithDetails;
  initialType?: "DEPOSIT" | "WITHDRAW";
  onClose: () => void;
}) {
  const { data: accounts = [] } = useAccounts();
  const { recordTransaction, isTransacting } = useSavings();

  const [type, setType] = React.useState<"DEPOSIT" | "WITHDRAW">(initialType);
  const [displayAmount, setDisplayAmount] = React.useState("");
  const [amount, setAmount] = React.useState<number>(0);
  const [accountId, setAccountId] = React.useState<string>(accounts[0]?.id || "");
  const [date, setDate] = React.useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = React.useState<string>("");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const isDeposit = type === "DEPOSIT";
  const myMaxWithdraw = Math.max(0, goal.myContribution);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const parsed = parseRupiahInput(rawVal);
    setAmount(parsed);
    setDisplayAmount(parsed > 0 ? formatRupiah(parsed) : "");
  };

  const handleSetMaxWithdraw = () => {
    setAmount(myMaxWithdraw);
    setDisplayAmount(formatRupiah(myMaxWithdraw));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (amount <= 0) {
      setErrorMsg("Nominal harus lebih dari 0");
      return;
    }

    if (!isDeposit && amount > myMaxWithdraw) {
      setErrorMsg(`Nominal penarikan melebihi total kontribusi tabungan Anda (${formatRupiah(myMaxWithdraw)})`);
      return;
    }

    try {
      await recordTransaction({
        goalId: goal.id,
        data: {
          type,
          amount,
          accountId: accountId || undefined,
          note: note.trim() || undefined,
          date: new Date(date),
        },
      });

      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Terjadi kesalahan saat memproses transaksi");
      }
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {isDeposit ? "Setor ke Tabungan" : "Tarik dari Tabungan"}
        </DialogTitle>
      </DialogHeader>

      {/* Target Info */}
      <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-md text-xs space-y-1">
        <div className="flex justify-between text-zinc-600">
          <span>Target Tabungan:</span>
          <span className="font-semibold text-zinc-950">{goal.name}</span>
        </div>
        <div className="flex justify-between text-zinc-600">
          <span>Total Terkumpul:</span>
          <span className="font-semibold tabular-nums text-zinc-950">
            {formatRupiah(goal.currentAmount)} / {formatRupiah(Number(goal.targetAmount))} ({goal.percentage}%)
          </span>
        </div>
        {goal.isShared && (
          <div className="flex justify-between text-zinc-600 border-t border-zinc-200 pt-1 mt-1">
            <span>Kontribusi Anda:</span>
            <span className="font-semibold tabular-nums text-emerald-700">
              {formatRupiah(goal.myContribution)}
            </span>
          </div>
        )}
      </div>

      {/* Action Type Toggle */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-100 rounded-md border border-zinc-200 text-xs font-medium">
        <button
          type="button"
          onClick={() => setType("DEPOSIT")}
          className={cn(
            "py-1.5 rounded transition-colors text-center cursor-pointer",
            isDeposit
              ? "bg-white text-zinc-950 font-semibold shadow-none border border-zinc-200"
              : "text-zinc-600 hover:text-zinc-950"
          )}
        >
          Setor Dana
        </button>
        <button
          type="button"
          onClick={() => setType("WITHDRAW")}
          className={cn(
            "py-1.5 rounded transition-colors text-center cursor-pointer",
            !isDeposit
              ? "bg-white text-zinc-950 font-semibold shadow-none border border-zinc-200"
              : "text-zinc-600 hover:text-zinc-950"
          )}
        >
          Tarik Dana
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 text-xs text-red-800 bg-red-50 border border-red-200 rounded-md">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-zinc-500">
              {isDeposit ? "Nominal Setoran (Rp)" : "Nominal Penarikan (Rp)"}
            </label>
            {!isDeposit && myMaxWithdraw > 0 && (
              <button
                type="button"
                onClick={handleSetMaxWithdraw}
                className="text-[11px] font-medium text-zinc-700 hover:text-zinc-950 underline cursor-pointer"
              >
                Tarik Semua ({formatRupiah(myMaxWithdraw)})
              </button>
            )}
          </div>
          <Input
            autoFocus
            type="text"
            inputMode="numeric"
            placeholder="Rp 0"
            value={displayAmount}
            onChange={handleAmountChange}
            className="text-2xl sm:text-3xl font-semibold tabular-nums h-14 px-3 border-zinc-300 focus-visible:border-zinc-950"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">
            {isDeposit ? "Potong dari Rekening Pribadi" : "Masuk ke Rekening Pribadi"}
          </label>
          <Select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            <option value="">Tanpa Sinkronisasi Rekening</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} (Saldo: {formatRupiah(Number(acc.currentBalance))})
              </option>
            ))}
          </Select>
          <p className="text-[11px] text-zinc-400 mt-1">
            Transaksi tabungan ini tidak akan memengaruhi grafik statistik laba/rugi bulanan Anda.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Tanggal Transaksi</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Catatan (Opsional)</label>
          <Input
            type="text"
            placeholder={isDeposit ? "Contoh: Sisa gaji bulan ini, bonus project" : "Contoh: Beli laptop, kebutuhan darurat"}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-9"
          />
        </div>

        <Button
          type="submit"
          disabled={isTransacting}
          className="w-full h-10 mt-6 bg-zinc-950 text-white hover:bg-zinc-800"
        >
          {isTransacting ? "Memproses..." : isDeposit ? "Simpan Setoran" : "Cairkan Penarikan"}
        </Button>
      </form>
    </>
  );
}

export function SavingsActionModal({
  open,
  onOpenChange,
  goal,
  initialType = "DEPOSIT",
}: SavingsActionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && goal && (
          <SavingsActionForm
            goal={goal}
            initialType={initialType}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

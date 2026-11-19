"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAccounts } from "@/hooks/use-accounts";
import { useSavings, SavingsGoalWithDetails } from "@/hooks/use-savings";
import { formatRupiah, parseRupiahInput } from "@/lib/utils";
import { format } from "date-fns";
import { TrendingUp, AlertCircle, ArrowUpRight } from "lucide-react";

interface SavingsYieldModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: SavingsGoalWithDetails | null;
}

function SavingsYieldForm({
  goal,
  onClose,
}: {
  goal: SavingsGoalWithDetails;
  onClose: () => void;
}) {
  const { data: accounts = [] } = useAccounts();
  const { recordTransaction, isTransacting } = useSavings();

  const currentAmt = Number(goal.currentAmount || 0);
  const principalAmt = Number(goal.principalAmount ?? currentAmt);
  const totalYield = Number(goal.totalYieldEarned || 0);

  const [displayValue, setDisplayValue] = React.useState("");
  const [newPortfolioValue, setNewPortfolioValue] = React.useState<number>(0);
  const [accountId, setAccountId] = React.useState<string>("");
  const [date, setDate] = React.useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = React.useState<string>(
    goal.yieldNote ? `Update imbal hasil ${goal.yieldNote}` : "Update imbal hasil tabungan"
  );
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const yieldDiff = newPortfolioValue - currentAmt;
  const isPositiveGain = yieldDiff > 0;

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const parsed = parseRupiahInput(rawVal);
    setNewPortfolioValue(parsed);
    setDisplayValue(parsed > 0 ? formatRupiah(parsed) : "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPortfolioValue <= 0) {
      setErrorMsg("Nilai portofolio saat ini harus lebih dari 0");
      return;
    }

    if (yieldDiff <= 0) {
      setErrorMsg("Nilai portofolio baru harus lebih besar dari saldo tabungan saat ini untuk mencatat imbal hasil");
      return;
    }

    try {
      await recordTransaction({
        goalId: goal.id,
        data: {
          type: "YIELD",
          amount: yieldDiff,
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
        setErrorMsg("Terjadi kesalahan saat mencatat imbal hasil");
      }
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-700" />
          <span>Update Nilai Portofolio & Imbal Hasil</span>
        </DialogTitle>
      </DialogHeader>

      {/* Target Info Summary */}
      <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-md text-xs space-y-1.5">
        <div className="flex justify-between items-center text-zinc-600">
          <span>Target Tabungan:</span>
          <span className="font-semibold text-zinc-950">{goal.name}</span>
        </div>
        {goal.yieldNote && (
          <div className="flex justify-between items-center text-zinc-600">
            <span>Instrumen:</span>
            <span className="font-medium text-zinc-800">{goal.yieldNote}</span>
          </div>
        )}
        <div className="flex justify-between items-center text-zinc-600 border-t border-zinc-200 pt-1.5 mt-1">
          <span>Total Saldo Tercatat:</span>
          <span className="font-bold tabular-nums text-zinc-950">
            {formatRupiah(currentAmt)}
          </span>
        </div>
        <div className="flex justify-between items-center text-zinc-500 text-[11px]">
          <span>Modal Pokok Disetor:</span>
          <span className="tabular-nums text-zinc-700">
            {formatRupiah(principalAmt)}
          </span>
        </div>
        <div className="flex justify-between items-center text-zinc-500 text-[11px]">
          <span>Total Imbal Hasil Sebelumnya:</span>
          <span className="tabular-nums font-medium text-emerald-700">
            +{formatRupiah(totalYield)}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 text-xs text-red-800 bg-red-50 border border-red-200 rounded-md">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Input Nilai Portofolio Terbaru */}
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">
            Nilai Portofolio Sekarang di Aplikasi (Bibit / Reksa Dana)
          </label>
          <Input
            autoFocus
            type="text"
            inputMode="numeric"
            placeholder="Rp 0"
            value={displayValue}
            onChange={handleValueChange}
            className="text-2xl sm:text-3xl font-semibold tabular-nums h-14 px-3 border-zinc-300 focus-visible:border-zinc-950"
          />
          <p className="text-[11px] text-zinc-400 mt-1">
            Masukkan angka total saldo tabungan ini yang tertera di aplikasi investasi Anda hari ini.
          </p>
        </div>

        {/* Dynamic Yield Preview */}
        {newPortfolioValue > 0 && (
          <div
            className={`p-3 rounded-md border text-xs space-y-1 ${
              isPositiveGain
                ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                : yieldDiff === 0
                ? "bg-zinc-50 border-zinc-200 text-zinc-700"
                : "bg-amber-50 border-amber-200 text-amber-950"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {isPositiveGain
                  ? "Imbal Hasil Baru Terdeteksi:"
                  : yieldDiff === 0
                  ? "Tidak Ada Selisih Nilai:"
                  : "Nilai Lebih Rendah:"}
              </span>
              <span className="text-sm font-bold tabular-nums">
                {isPositiveGain ? `+${formatRupiah(yieldDiff)}` : formatRupiah(yieldDiff)}
              </span>
            </div>
            <p className="text-[11px] opacity-80">
              {isPositiveGain
                ? "Sistem akan mencatat selisih kenaikan ini sebagai pendapatan imbal hasil otomatis."
                : yieldDiff === 0
                ? "Nilai portofolio yang Anda masukkan sama dengan saldo yang sudah tercatat."
                : "Nilai baru lebih kecil dari saldo saat ini. Pastikan nominal yang Anda masukkan sudah benar."}
            </p>
          </div>
        )}

        {/* Rekening Tujuan Sinkronisasi */}
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">
            Sinkronisasi ke Rekening Pribadi (Opsional)
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
            Pilih jika Anda memiliki rekening tampungan khusus (seperti Rekening Bibit RDPU) di PantauUang. Pendapatan imbal hasil ini otomatis dikecualikan dari statistik pengeluaran/pemasukan rutin bulanan.
          </p>
        </div>

        {/* Tanggal */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Tanggal Catat</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9"
          />
        </div>

        {/* Catatan */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Catatan Transaksi</label>
          <Input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-9"
          />
        </div>

        <Button
          type="submit"
          disabled={isTransacting || yieldDiff <= 0}
          className="w-full h-10 mt-6 bg-zinc-950 text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {isTransacting ? (
            "Memproses..."
          ) : isPositiveGain ? (
            <span className="flex items-center gap-1.5">
              <ArrowUpRight className="h-4 w-4" />
              <span>Simpan Imbal Hasil (+{formatRupiah(yieldDiff)})</span>
            </span>
          ) : (
            "Masukkan Nilai Portofolio Lebih Tinggi"
          )}
        </Button>
      </form>
    </>
  );
}

export function SavingsYieldModal({
  open,
  onOpenChange,
  goal,
}: SavingsYieldModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        {open && goal && (
          <SavingsYieldForm
            goal={goal}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}


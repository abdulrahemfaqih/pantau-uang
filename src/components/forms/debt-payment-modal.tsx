"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAccounts } from "@/hooks/use-accounts";
import { useDebts, DebtWithPayments } from "@/hooks/use-debts";
import { formatRupiah, parseRupiahInput } from "@/lib/utils";
import { format } from "date-fns";

interface DebtPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debt: DebtWithPayments | null;
}

function DebtPaymentForm({
  debt,
  onClose,
}: {
  debt: DebtWithPayments;
  onClose: () => void;
}) {
  const { data: accounts = [] } = useAccounts();
  const { recordPayment, isPaying } = useDebts();

  const remaining = Number(debt.remainingAmount);
  const [displayAmount, setDisplayAmount] = React.useState(formatRupiah(remaining));
  const [amount, setAmount] = React.useState<number>(remaining);
  const [accountId, setAccountId] = React.useState<string>(accounts[0]?.id || "");
  const [date, setDate] = React.useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = React.useState<string>("");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const parsed = parseRupiahInput(rawVal);
    setAmount(parsed);
    setDisplayAmount(parsed > 0 ? formatRupiah(parsed) : "");
  };

  const handlePayFull = () => {
    setAmount(remaining);
    setDisplayAmount(formatRupiah(remaining));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (amount <= 0) {
      setErrorMsg("Nominal pembayaran harus lebih dari 0");
      return;
    }

    if (amount > remaining) {
      setErrorMsg(`Nominal pembayaran melebihi sisa tagihan (${formatRupiah(remaining)})`);
      return;
    }

    try {
      await recordPayment({
        debtId: debt.id,
        data: {
          amount,
          accountId: accountId || undefined,
          date: new Date(date),
          note: note.trim() || undefined,
        },
      });

      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Terjadi kesalahan saat mencatat pembayaran");
      }
    }
  };

  const isDebt = debt.type === "DEBT";

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {isDebt ? "Bayar Hutang" : "Terima Pembayaran Piutang"}
        </DialogTitle>
      </DialogHeader>

      {/* Target Info */}
      <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-md text-xs space-y-1">
        <div className="flex justify-between text-zinc-600">
          <span>Pihak:</span>
          <span className="font-semibold text-zinc-950">{debt.personName}</span>
        </div>
        <div className="flex justify-between text-zinc-600">
          <span>Total Tagihan Awal:</span>
          <span className="tabular-nums">{formatRupiah(Number(debt.amount))}</span>
        </div>
        <div className="flex justify-between text-zinc-600 pt-1 border-t border-zinc-200">
          <span>Sisa yang Belum Lunas:</span>
          <span className="font-bold text-zinc-950 tabular-nums">
            {formatRupiah(remaining)}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 text-xs text-red-800 bg-red-50 border border-red-200 rounded-md">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-zinc-500">Nominal Pembayaran (Rp)</label>
            <button
              type="button"
              onClick={handlePayFull}
              className="text-[11px] font-medium text-zinc-700 hover:text-zinc-950 underline cursor-pointer"
            >
              Bayar Lunas
            </button>
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
            {isDebt ? "Ambil dari Rekening" : "Masuk ke Rekening"}
          </label>
          <Select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            <option value="">Jangan sinkronkan dengan rekening</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} (Saldo: {formatRupiah(Number(acc.currentBalance))})
              </option>
            ))}
          </Select>
          <p className="text-[11px] text-zinc-400 mt-1">
            Jika dipilih, saldo rekening dan riwayat arus kas akan otomatis terbarui.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Tanggal Bayar</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Keterangan (Opsional)</label>
            <Input
              type="text"
              placeholder="Cicilan ke-1, transfer BCA, dll"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isPaying}
          className="w-full h-10 mt-6 bg-zinc-950 text-white hover:bg-zinc-800"
        >
          {isPaying ? "Menyimpan..." : "Konfirmasi Pembayaran"}
        </Button>
      </form>
    </>
  );
}

export function DebtPaymentModal({ open, onOpenChange, debt }: DebtPaymentModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && debt && <DebtPaymentForm debt={debt} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebts } from "@/hooks/use-debts";
import { cn, formatRupiah, parseRupiahInput } from "@/lib/utils";
import { DebtType } from "@/lib/validations";

interface DebtModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DebtForm({ onClose }: { onClose: () => void }) {
  const { createDebt, isCreating } = useDebts();

  const [type, setType] = React.useState<DebtType>("DEBT");
  const [personName, setPersonName] = React.useState("");
  const [displayAmount, setDisplayAmount] = React.useState("");
  const [amount, setAmount] = React.useState<number>(0);
  const [dueDate, setDueDate] = React.useState<string>("");
  const [note, setNote] = React.useState<string>("");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const parsed = parseRupiahInput(rawVal);
    setAmount(parsed);
    setDisplayAmount(parsed > 0 ? formatRupiah(parsed) : "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!personName.trim()) {
      setErrorMsg("Nama pihak / orang wajib diisi");
      return;
    }

    if (amount <= 0) {
      setErrorMsg("Nominal harus lebih dari 0");
      return;
    }

    try {
      await createDebt({
        type,
        personName: personName.trim(),
        amount,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        note: note.trim() || undefined,
      });

      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Terjadi kesalahan saat menyimpan catatan");
      }
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Catat Hutang / Piutang</DialogTitle>
      </DialogHeader>

      {/* Tab Switcher */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-100 rounded-md border border-zinc-200 text-xs font-medium">
        <button
          type="button"
          onClick={() => setType("DEBT")}
          className={cn(
            "py-1.5 rounded transition-colors text-center cursor-pointer",
            type === "DEBT"
              ? "bg-white text-zinc-950 font-semibold shadow-none border border-zinc-200"
              : "text-zinc-600 hover:text-zinc-950"
          )}
        >
          Hutang (Kewajiban Saya)
        </button>
        <button
          type="button"
          onClick={() => setType("LOAN")}
          className={cn(
            "py-1.5 rounded transition-colors text-center cursor-pointer",
            type === "LOAN"
              ? "bg-white text-zinc-950 font-semibold shadow-none border border-zinc-200"
              : "text-zinc-600 hover:text-zinc-950"
          )}
        >
          Piutang (Hak Tagih Saya)
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 text-xs text-red-800 bg-red-50 border border-red-200 rounded-md">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">
            {type === "DEBT" ? "Nama Pemberi Pinjaman" : "Nama Peminjam"}
          </label>
          <Input
            autoFocus
            type="text"
            placeholder="Contoh: Budi, Bank Mandiri, Teman Kantor"
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            className="h-9"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Nominal (Rp)</label>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="Rp 0"
            value={displayAmount}
            onChange={handleAmountChange}
            className="text-2xl sm:text-3xl font-semibold tabular-nums h-14 px-3 border-zinc-300 focus-visible:border-zinc-950"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Batas Waktu / Jatuh Tempo (Opsional)</label>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="h-9"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Catatan Tambahan (Opsional)</label>
          <Input
            type="text"
            placeholder="Alasan pinjaman, perjanjian, dll"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-9"
          />
        </div>

        <Button
          type="submit"
          disabled={isCreating}
          className="w-full h-10 mt-6 bg-zinc-950 text-white hover:bg-zinc-800"
        >
          {isCreating ? "Menyimpan..." : "Simpan Catatan"}
        </Button>
      </form>
    </>
  );
}

export function DebtModal({ open, onOpenChange }: DebtModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && <DebtForm onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

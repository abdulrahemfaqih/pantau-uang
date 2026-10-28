"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAccounts } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import { useRecurring } from "@/hooks/use-recurring";
import { cn, formatRupiah, parseRupiahInput } from "@/lib/utils";
import { format } from "date-fns";
import { RecurringFrequency } from "@/lib/validations";

interface RecurringModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TabType = "EXPENSE" | "INCOME" | "TRANSFER";

function RecurringForm({ onClose }: { onClose: () => void }) {
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const { createRecurring, isCreating } = useRecurring();

  const [activeTab, setActiveTab] = React.useState<TabType>("EXPENSE");
  const [displayAmount, setDisplayAmount] = React.useState("");
  const [amount, setAmount] = React.useState<number>(0);
  const [accountId, setAccountId] = React.useState<string>(accounts[0]?.id || "");
  const [toAccountId, setToAccountId] = React.useState<string>(accounts[1]?.id || "");
  const [categoryId, setCategoryId] = React.useState<string>(
    categories.find((c) => c.type === "EXPENSE")?.id || ""
  );
  const [frequency, setFrequency] = React.useState<RecurringFrequency>("MONTHLY");
  const [startDate, setStartDate] = React.useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = React.useState<string>("");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const filteredCategories = React.useMemo(() => {
    if (activeTab === "TRANSFER") return [];
    return categories.filter((c) => c.type === activeTab);
  }, [categories, activeTab]);

  // Pastikan categoryId selalu valid dan sinkron dengan tab tipe yang sedang dipilih
  const selectedCategoryId = React.useMemo(() => {
    if (activeTab === "TRANSFER") return "";
    if (filteredCategories.some((c) => c.id === categoryId)) {
      return categoryId;
    }
    return filteredCategories[0]?.id || "";
  }, [activeTab, filteredCategories, categoryId]);

  // Pastikan accountId selalu valid jika accounts sudah termuat
  const selectedAccountId = React.useMemo(() => {
    if (accountId && accounts.some((a) => a.id === accountId)) {
      return accountId;
    }
    return accounts[0]?.id || "";
  }, [accounts, accountId]);

  // Pastikan toAccountId selalu valid dan berbeda dari accountId untuk transfer
  const selectedToAccountId = React.useMemo(() => {
    if (toAccountId && accounts.some((a) => a.id === toAccountId)) {
      return toAccountId;
    }
    const otherAccount = accounts.find((a) => a.id !== selectedAccountId);
    return otherAccount?.id || accounts[1]?.id || "";
  }, [accounts, toAccountId, selectedAccountId]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const parsed = parseRupiahInput(rawVal);
    setAmount(parsed);
    setDisplayAmount(parsed > 0 ? formatRupiah(parsed) : "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (amount <= 0) {
      setErrorMsg("Nominal harus lebih dari 0");
      return;
    }

    if (!selectedAccountId) {
      setErrorMsg("Rekening asal wajib dipilih");
      return;
    }

    if (activeTab === "TRANSFER") {
      if (!selectedToAccountId) {
        setErrorMsg("Rekening tujuan wajib dipilih");
        return;
      }
      if (selectedAccountId === selectedToAccountId) {
        setErrorMsg("Rekening tujuan tidak boleh sama dengan rekening asal");
        return;
      }
    } else {
      if (!selectedCategoryId) {
        setErrorMsg("Kategori transaksi wajib dipilih");
        return;
      }
    }

    try {
      await createRecurring({
        type: activeTab,
        amount,
        accountId: selectedAccountId,
        toAccountId: activeTab === "TRANSFER" ? selectedToAccountId : undefined,
        categoryId: activeTab !== "TRANSFER" ? selectedCategoryId : undefined,
        frequency,
        startDate: new Date(startDate),
        note: note.trim() || undefined,
      });

      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Terjadi kesalahan saat menyimpan transaksi berulang");
      }
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Buat Transaksi Berulang</DialogTitle>
      </DialogHeader>

      {/* Tab Switcher */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-100 rounded-md border border-zinc-200 text-xs font-medium">
        <button
          type="button"
          onClick={() => {
            setActiveTab("EXPENSE");
            const expCat = categories.find((c) => c.type === "EXPENSE");
            setCategoryId(expCat?.id || "");
          }}
          className={cn(
            "py-1.5 rounded transition-colors text-center cursor-pointer",
            activeTab === "EXPENSE"
              ? "bg-white text-zinc-950 font-semibold shadow-none border border-zinc-200"
              : "text-zinc-600 hover:text-zinc-950"
          )}
        >
          Pengeluaran
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("INCOME");
            const incCat = categories.find((c) => c.type === "INCOME");
            setCategoryId(incCat?.id || "");
          }}
          className={cn(
            "py-1.5 rounded transition-colors text-center cursor-pointer",
            activeTab === "INCOME"
              ? "bg-white text-zinc-950 font-semibold shadow-none border border-zinc-200"
              : "text-zinc-600 hover:text-zinc-950"
          )}
        >
          Pemasukan
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("TRANSFER")}
          className={cn(
            "py-1.5 rounded transition-colors text-center cursor-pointer",
            activeTab === "TRANSFER"
              ? "bg-white text-zinc-950 font-semibold shadow-none border border-zinc-200"
              : "text-zinc-600 hover:text-zinc-950"
          )}
        >
          Transfer
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 text-xs text-red-800 bg-red-50 border border-red-200 rounded-md">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Nominal (Rp)</label>
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Frekuensi Berulang</label>
            <Select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
            >
              <option value="DAILY">Setiap Hari</option>
              <option value="WEEKLY">Setiap Minggu</option>
              <option value="MONTHLY">Setiap Bulan</option>
              <option value="YEARLY">Setiap Tahun</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Mulai Tanggal</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        {activeTab !== "TRANSFER" ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Rekening</label>
              <Select
                value={selectedAccountId}
                onChange={(e) => setAccountId(e.target.value)}
              >
                {accounts.length === 0 && <option value="">Belum ada rekening</option>}
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Kategori</label>
              <Select
                value={selectedCategoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {filteredCategories.length === 0 && <option value="">Belum ada kategori</option>}
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Dari Rekening</label>
              <Select
                value={selectedAccountId}
                onChange={(e) => setAccountId(e.target.value)}
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Ke Rekening</label>
              <Select
                value={selectedToAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Catatan / Keterangan</label>
          <Input
            type="text"
            placeholder="Contoh: Tagihan WiFi, Netflix, Gaji Bulanan"
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
          {isCreating ? "Menyimpan..." : "Buat Transaksi Berulang"}
        </Button>
      </form>
    </>
  );
}

export function RecurringModal({ open, onOpenChange }: RecurringModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && <RecurringForm onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

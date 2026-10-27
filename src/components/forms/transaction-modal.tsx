"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAccounts } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import { useTransactions, TransactionWithDetails } from "@/hooks/use-transactions";
import { cn, formatRupiah, parseRupiahInput } from "@/lib/utils";
import { format } from "date-fns";

interface TransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionToEdit?: TransactionWithDetails | null;
}

type TabType = "EXPENSE" | "INCOME" | "TRANSFER";

function TransactionForm({
  transactionToEdit,
  onClose,
}: {
  transactionToEdit?: TransactionWithDetails | null;
  onClose: () => void;
}) {
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const { createTransaction, updateTransaction, isCreating, isUpdating } = useTransactions();

  const [activeTab, setActiveTab] = React.useState<TabType>(
    (transactionToEdit?.type as TabType) || "EXPENSE"
  );
  const initialAmount = transactionToEdit ? Number(transactionToEdit.amount) : 0;
  const [displayAmount, setDisplayAmount] = React.useState(
    initialAmount > 0 ? formatRupiah(initialAmount) : ""
  );
  const [amount, setAmount] = React.useState<number>(initialAmount);
  const [accountId, setAccountId] = React.useState<string>(
    transactionToEdit?.accountId || accounts[0]?.id || ""
  );
  const [toAccountId, setToAccountId] = React.useState<string>(
    transactionToEdit?.toAccountId || accounts[1]?.id || ""
  );
  const [categoryId, setCategoryId] = React.useState<string>(
    transactionToEdit?.categoryId ||
      categories.find((c) => c.type === (transactionToEdit?.type || "EXPENSE"))?.id ||
      ""
  );
  const [date, setDate] = React.useState<string>(
    transactionToEdit
      ? format(new Date(transactionToEdit.date), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd")
  );
  const [note, setNote] = React.useState<string>(transactionToEdit?.note || "");
  const [adminFeeDisplay, setAdminFeeDisplay] = React.useState("");
  const [adminFee, setAdminFee] = React.useState<number>(0);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Filtered categories according to current tab
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

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const parsed = parseRupiahInput(rawVal);
    setAmount(parsed);
    setDisplayAmount(parsed > 0 ? formatRupiah(parsed) : "");
  };

  const handleAdminFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const parsed = parseRupiahInput(rawVal);
    setAdminFee(parsed);
    setAdminFeeDisplay(parsed > 0 ? formatRupiah(parsed) : "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (amount <= 0) {
      setErrorMsg("Nominal harus lebih dari 0");
      return;
    }

    if (!accountId) {
      setErrorMsg("Rekening asal wajib dipilih");
      return;
    }

    if (activeTab === "TRANSFER") {
      if (!toAccountId) {
        setErrorMsg("Rekening tujuan wajib dipilih");
        return;
      }
      if (accountId === toAccountId) {
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
      const payload = {
        type: activeTab,
        amount,
        date: new Date(date),
        note: note.trim() || undefined,
        accountId,
        toAccountId: activeTab === "TRANSFER" ? toAccountId : undefined,
        categoryId: activeTab !== "TRANSFER" ? selectedCategoryId : undefined,
        adminFee: activeTab === "TRANSFER" ? adminFee : 0,
      };

      if (transactionToEdit) {
        await updateTransaction({
          id: transactionToEdit.id,
          data: payload,
        });
      } else {
        await createTransaction(payload);
      }

      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Terjadi kesalahan saat menyimpan transaksi");
      }
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{transactionToEdit ? "Edit Transaksi" : "Catat Transaksi"}</DialogTitle>
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
        {/* Big Nominal Input with Autofocus */}
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

        {activeTab !== "TRANSFER" ? (
          /* Expense / Income Fields */
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Rekening</label>
                <Select
                  value={accountId}
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Tanggal</label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-9"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Catatan</label>
                <Input
                  type="text"
                  placeholder="Makan siang, bensin, dll"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
          </div>
        ) : (
          /* Transfer Fields */
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Dari Rekening</label>
                <Select
                  value={accountId}
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
                  value={toAccountId}
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

            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Biaya Admin (Opsional)</label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="Rp 0"
                value={adminFeeDisplay}
                onChange={handleAdminFeeChange}
                className="h-9 tabular-nums"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Tanggal</label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-9"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Catatan</label>
                <Input
                  type="text"
                  placeholder="Transfer antar rekening"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
          </div>
        )}

        {/* Full Width Save Button */}
        <Button
          type="submit"
          disabled={isCreating || isUpdating}
          className="w-full h-10 mt-6 bg-zinc-950 text-white hover:bg-zinc-800"
        >
          {transactionToEdit
            ? isUpdating
              ? "Menyimpan Perubahan..."
              : "Simpan Perubahan"
            : isCreating
            ? "Menyimpan..."
            : "Simpan Transaksi"}
        </Button>
      </form>
    </>
  );
}

export function TransactionModal({ open, onOpenChange, transactionToEdit }: TransactionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && (
          <TransactionForm
            transactionToEdit={transactionToEdit}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

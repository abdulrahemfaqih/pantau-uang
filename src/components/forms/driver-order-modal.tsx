"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAccounts } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import { useDriverOrder } from "@/hooks/use-driver-order";
import { cn, formatRupiah, parseRupiahInput } from "@/lib/utils";
import { format } from "date-fns";
import { Bike, ArrowRight } from "lucide-react";

interface DriverOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DriverOrderForm({ onClose }: { onClose: () => void }) {
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const { createDriverOrder, isSubmitting } = useDriverOrder();

  const [orderNumber, setOrderNumber] = React.useState("");
  const [driverIncome, setDriverIncome] = React.useState<number>(0);
  const [displayDriverIncome, setDisplayDriverIncome] = React.useState("");
  const [codAmount, setCodAmount] = React.useState<number>(0);
  const [displayCodAmount, setDisplayCodAmount] = React.useState("");
  const [dateTime, setDateTime] = React.useState<string>(() =>
    format(new Date(), "yyyy-MM-dd'T'HH:mm")
  );

  const [appAccountId, setAppAccountId] = React.useState("");
  const [cashAccountId, setCashAccountId] = React.useState("");
  const [incomeCategoryId, setIncomeCategoryId] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Kategori pemasukan yang tersedia
  const incomeCategories = React.useMemo(() => {
    return categories.filter((c) => c.type === "INCOME");
  }, [categories]);

  // Rekomendasi otomatis dan fallback akun dompet aplikasi (EWALLET / nama driver)
  const selectedAppAccountId = React.useMemo(() => {
    if (appAccountId && accounts.some((a) => a.id === appAccountId)) {
      return appAccountId;
    }
    const byName = accounts.find((a) =>
      /driver|shopee|gopay|grab|maxim|ojol/i.test(a.name)
    );
    if (byName) return byName.id;
    const byType = accounts.find((a) => a.type === "EWALLET");
    if (byType) return byType.id;
    return accounts[0]?.id || "";
  }, [accounts, appAccountId]);

  // Rekomendasi otomatis dan fallback akun dompet tunai fisik (CASH / nama tunai/cash/kantong)
  const selectedCashAccountId = React.useMemo(() => {
    if (cashAccountId && accounts.some((a) => a.id === cashAccountId)) {
      return cashAccountId;
    }
    const byType = accounts.find((a) => a.type === "CASH");
    if (byType) return byType.id;
    const byName = accounts.find((a) =>
      /cash|tunai|kantong|dompet/i.test(a.name)
    );
    if (byName) return byName.id;
    const other = accounts.find((a) => a.id !== selectedAppAccountId);
    return other?.id || accounts[1]?.id || "";
  }, [accounts, cashAccountId, selectedAppAccountId]);

  // Rekomendasi otomatis dan fallback kategori pendapatan driver
  const selectedIncomeCategoryId = React.useMemo(() => {
    if (incomeCategoryId && incomeCategories.some((c) => c.id === incomeCategoryId)) {
      return incomeCategoryId;
    }
    const byName = incomeCategories.find((c) =>
      /driver|ojol|kurir|ongkir|trip|order|gaji|pendapatan/i.test(c.name)
    );
    return byName?.id || incomeCategories[0]?.id || "";
  }, [incomeCategories, incomeCategoryId]);

  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const parsed = parseRupiahInput(rawVal);
    setDriverIncome(parsed);
    setDisplayDriverIncome(parsed > 0 ? formatRupiah(parsed) : "");
  };

  const handleCodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const parsed = parseRupiahInput(rawVal);
    setCodAmount(parsed);
    setDisplayCodAmount(parsed > 0 ? formatRupiah(parsed) : "");
  };

  const selectedAppAccount = accounts.find((a) => a.id === selectedAppAccountId);
  const selectedCashAccount = accounts.find((a) => a.id === selectedCashAccountId);
  const appAccountName = selectedAppAccount?.name || "Dompet Aplikasi";
  const cashAccountName = selectedCashAccount?.name || "Dompet Tunai";

  const netAppChange = driverIncome - codAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!orderNumber.trim()) {
      setErrorMsg("Nomor order atau catatan order wajib diisi");
      return;
    }

    if (driverIncome <= 0) {
      setErrorMsg("Nominal pendapatan driver harus lebih dari 0");
      return;
    }

    if (!selectedAppAccountId) {
      setErrorMsg("Rekening dompet aplikasi wajib dipilih");
      return;
    }

    if (!selectedIncomeCategoryId) {
      setErrorMsg("Kategori pendapatan wajib dipilih");
      return;
    }

    if (codAmount > 0) {
      if (!selectedCashAccountId) {
        setErrorMsg("Rekening dompet tunai fisik wajib dipilih untuk order COD");
        return;
      }
      if (selectedAppAccountId === selectedCashAccountId) {
        setErrorMsg("Rekening tunai tidak boleh sama dengan rekening aplikasi");
        return;
      }
    }

    try {
      await createDriverOrder({
        orderNumber: orderNumber.trim(),
        driverIncome,
        codAmount,
        date: new Date(dateTime),
        appAccountId: selectedAppAccountId,
        cashAccountId: codAmount > 0 ? selectedCashAccountId : null,
        incomeCategoryId: selectedIncomeCategoryId,
      });

      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Terjadi kesalahan saat memproses order driver");
      }
    }
  };

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-zinc-950 text-white flex items-center justify-center">
            <Bike className="h-4 w-4" />
          </div>
          <DialogTitle>Catat Order Driver (Ojol / COD)</DialogTitle>
        </div>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {errorMsg}
          </div>
        )}

        {/* Nomor Order / Catatan */}
        <div className="space-y-1">
          <label className="text-zinc-700 font-medium">Nomor Order / Catatan</label>
          <Input
            type="text"
            placeholder="Contoh: #199 - Mie Gacoan"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            className="h-9 text-xs"
            required
          />
        </div>

        {/* Input Nominal Pendapatan & COD */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Pendapatan Bersih Driver */}
          <div className="space-y-1">
            <label className="text-zinc-700 font-medium">
              Pendapatan Bersih (Ongkir + Tip)
            </label>
            <Input
              type="text"
              placeholder="Rp 0"
              value={displayDriverIncome}
              onChange={handleIncomeChange}
              className="h-9 text-xs font-semibold tabular-nums"
              required
            />
          </div>

          {/* Tagihan Tunai COD */}
          <div className="space-y-1">
            <label className="text-zinc-700 font-medium">
              Tagihan Tunai COD (0 jika non-COD)
            </label>
            <Input
              type="text"
              placeholder="Rp 0"
              value={displayCodAmount}
              onChange={handleCodChange}
              className="h-9 text-xs tabular-nums"
            />
          </div>
        </div>

        {/* Tanggal & Waktu */}
        <div className="space-y-1">
          <label className="text-zinc-700 font-medium">Waktu Transaksi</label>
          <Input
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            className="h-9 text-xs"
            required
          />
        </div>

        {/* Pilihan Akun Dompet */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Akun Dompet Aplikasi */}
          <div className="space-y-1">
            <label className="text-zinc-700 font-medium">Dompet Aplikasi (Sistem)</label>
            <Select
              value={selectedAppAccountId}
              onChange={(e) => setAppAccountId(e.target.value)}
              className="h-9 text-xs"
              required
            >
              <option value="" disabled>Pilih dompet aplikasi...</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type})
                </option>
              ))}
            </Select>
          </div>

          {/* Akun Dompet Tunai Fisik */}
          <div className="space-y-1">
            <label className="text-zinc-700 font-medium">
              Dompet Tunai Fisik {codAmount > 0 ? "(Wajib untuk COD)" : "(Opsional)"}
            </label>
            <Select
              value={selectedCashAccountId}
              onChange={(e) => setCashAccountId(e.target.value)}
              className="h-9 text-xs"
              disabled={codAmount <= 0 && accounts.length > 0}
            >
              <option value="" disabled>Pilih akun tunai fisik...</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type})
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Kategori Pendapatan */}
        <div className="space-y-1">
          <label className="text-zinc-700 font-medium">Kategori Pendapatan</label>
          <Select
            value={selectedIncomeCategoryId}
            onChange={(e) => setIncomeCategoryId(e.target.value)}
            className="h-9 text-xs"
            required
          >
            <option value="" disabled>Pilih kategori pendapatan...</option>
            {incomeCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
        </div>

        {/* Ringkasan Mutasi Saldo */}
        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3.5 space-y-2 text-xs">
          <div className="font-semibold text-zinc-950 flex items-center justify-between">
            <span>Ringkasan Mutasi Saldo</span>
            <span className="text-[11px] font-normal text-zinc-600">
              {codAmount > 0 ? "Pesanan COD" : "Pesanan Non-COD"}
            </span>
          </div>

          <div className="space-y-1.5 pt-1 border-t border-zinc-200">
            <div className="flex items-center justify-between text-zinc-600">
              <span>Pendapatan Driver (Masuk Aplikasi)</span>
              <span className="font-semibold text-emerald-700 tabular-nums">
                +{formatRupiah(driverIncome)}
              </span>
            </div>

            {codAmount > 0 && (
              <>
                <div className="flex items-center justify-between text-zinc-600">
                  <span>Tagihan Tunai COD (Diterima Driver)</span>
                  <span className="font-semibold text-zinc-950 tabular-nums">
                    +{formatRupiah(codAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-600">
                  <span>Potongan Saldo Dompet Aplikasi</span>
                  <span className="font-semibold text-red-700 tabular-nums">
                    -{formatRupiah(codAmount)}
                  </span>
                </div>
              </>
            )}

            <div className="pt-2 border-t border-zinc-200 flex flex-col gap-1 text-[11px]">
              <div className="flex items-center justify-between font-medium">
                <span className="text-zinc-700">Dampak {appAccountName}:</span>
                <span
                  className={cn(
                    "tabular-nums font-semibold",
                    netAppChange >= 0 ? "text-emerald-700" : "text-zinc-950"
                  )}
                >
                  {netAppChange >= 0 ? "+" : ""}
                  {formatRupiah(netAppChange)}
                </span>
              </div>
              {codAmount > 0 && (
                <div className="flex items-center justify-between font-medium">
                  <span className="text-zinc-700">Dampak {cashAccountName}:</span>
                  <span className="text-emerald-700 tabular-nums font-semibold">
                    +{formatRupiah(codAmount)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tombol Aksi */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs h-9"
          >
            Batal
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting}
            className="bg-zinc-950 text-white hover:bg-zinc-800 text-xs h-9 flex items-center gap-1.5"
          >
            <span>{isSubmitting ? "Menyimpan..." : "Simpan Order"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </form>
    </>
  );
}

export function DriverOrderModal({ open, onOpenChange }: DriverOrderModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DriverOrderForm onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

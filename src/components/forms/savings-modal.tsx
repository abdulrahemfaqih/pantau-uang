"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAccounts } from "@/hooks/use-accounts";
import { useSavings } from "@/hooks/use-savings";
import { cn, formatRupiah, parseRupiahInput } from "@/lib/utils";
import { PiggyBank, Heart, Plane, Laptop, Home, Car, ShieldCheck, GraduationCap, Gift } from "lucide-react";

interface SavingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AVAILABLE_ICONS = [
  { name: "PiggyBank", icon: PiggyBank, label: "Celengan" },
  { name: "Heart", icon: Heart, label: "Nikah/Pasangan" },
  { name: "Plane", icon: Plane, label: "Liburan" },
  { name: "Laptop", icon: Laptop, label: "Gadget" },
  { name: "Home", icon: Home, label: "Rumah" },
  { name: "Car", icon: Car, label: "Kendaraan" },
  { name: "ShieldCheck", icon: ShieldCheck, label: "Dana Darurat" },
  { name: "GraduationCap", icon: GraduationCap, label: "Pendidikan" },
  { name: "Gift", icon: Gift, label: "Hadiah" },
];

const AVAILABLE_COLORS = [
  { name: "Hitam", value: "#09090B" },
  { name: "Hijau", value: "#059669" },
  { name: "Biru", value: "#2563EB" },
  { name: "Ungu", value: "#7C3AED" },
  { name: "Merah Muda", value: "#E11D48" },
  { name: "Oranye", value: "#D97706" },
];

function SavingsForm({ onClose }: { onClose: () => void }) {
  const { data: accounts = [] } = useAccounts();
  const { createGoal, isCreating } = useSavings();

  const [isShared, setIsShared] = React.useState(false);
  const [hasYield, setHasYield] = React.useState(false);
  const [yieldNote, setYieldNote] = React.useState("");
  const [name, setName] = React.useState("");
  const [displayTarget, setDisplayTarget] = React.useState("");
  const [targetAmount, setTargetAmount] = React.useState<number>(0);

  const [displayInitial, setDisplayInitial] = React.useState("");
  const [initialAmount, setInitialAmount] = React.useState<number>(0);
  const [initialAccountId, setInitialAccountId] = React.useState<string>("");

  const [targetDate, setTargetDate] = React.useState<string>("");
  const [icon, setIcon] = React.useState<string>("PiggyBank");
  const [color, setColor] = React.useState<string>("#09090B");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const parsed = parseRupiahInput(rawVal);
    setTargetAmount(parsed);
    setDisplayTarget(parsed > 0 ? formatRupiah(parsed) : "");
  };

  const handleInitialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const parsed = parseRupiahInput(rawVal);
    setInitialAmount(parsed);
    setDisplayInitial(parsed > 0 ? formatRupiah(parsed) : "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg("Nama tabungan wajib diisi");
      return;
    }

    if (targetAmount <= 0) {
      setErrorMsg("Target nominal tabungan harus lebih dari 0");
      return;
    }

    if (initialAmount > targetAmount) {
      setErrorMsg("Setoran awal tidak boleh melebihi target nominal");
      return;
    }

    try {
      await createGoal({
        name: name.trim(),
        targetAmount,
        targetDate: targetDate ? new Date(targetDate) : undefined,
        icon,
        color,
        isShared,
        hasYield,
        yieldNote: hasYield && yieldNote.trim() ? yieldNote.trim() : undefined,
        initialAmount: initialAmount > 0 ? initialAmount : undefined,
        initialAccountId: initialAmount > 0 && initialAccountId ? initialAccountId : undefined,
      });

      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Terjadi kesalahan saat membuat tabungan");
      }
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Buat Target Tabungan</DialogTitle>
      </DialogHeader>

      {/* Tab Switcher: Mandiri vs Bersama */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-100 rounded-md border border-zinc-200 text-xs font-medium">
        <button
          type="button"
          onClick={() => setIsShared(false)}
          className={cn(
            "py-1.5 rounded transition-colors text-center cursor-pointer",
            !isShared
              ? "bg-white text-zinc-950 font-semibold shadow-none border border-zinc-200"
              : "text-zinc-600 hover:text-zinc-950"
          )}
        >
          Tabungan Mandiri
        </button>
        <button
          type="button"
          onClick={() => setIsShared(true)}
          className={cn(
            "py-1.5 rounded transition-colors text-center cursor-pointer",
            isShared
              ? "bg-white text-zinc-950 font-semibold shadow-none border border-zinc-200"
              : "text-zinc-600 hover:text-zinc-950"
          )}
        >
          Tabungan Bersama
        </button>
      </div>

      <p className="text-[11px] text-zinc-500">
        {isShared
          ? "Tabungan bersama memungkinkan Anda mengundang pasangan/teman dengan kode unik. Uang fisik tetap disimpan di rekening masing-masing anggota."
          : "Tabungan mandiri untuk mencapai target keuangan impian Anda sendiri."}
      </p>

      {errorMsg && (
        <div className="p-3 text-xs text-red-800 bg-red-50 border border-red-200 rounded-md">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Nama Target Tabungan</label>
          <Input
            autoFocus
            type="text"
            placeholder="Contoh: Tabungan Nikah, Dana Darurat, Beli Laptop"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-9"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Target Nominal (Rp)</label>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="Rp 0"
            value={displayTarget}
            onChange={handleTargetChange}
            className="text-2xl sm:text-3xl font-semibold tabular-nums h-14 px-3 border-zinc-300 focus-visible:border-zinc-950"
          />
        </div>

        {/* Setoran Awal (Opsional) */}
        <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-md space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Setoran Awal (Opsional)</label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="Rp 0"
              value={displayInitial}
              onChange={handleInitialChange}
              className="h-9 tabular-nums bg-white"
            />
          </div>

          {initialAmount > 0 && (
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Rekening Sumber Setoran Awal</label>
              <Select
                value={initialAccountId}
                onChange={(e) => setInitialAccountId(e.target.value)}
                className="bg-white"
              >
                <option value="">Tanpa Potong Saldo Rekening</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (Saldo: {formatRupiah(Number(acc.currentBalance))})
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>

        {/* Instrumen Imbal Hasil / RDPU */}
        <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-md space-y-3">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={hasYield}
              onChange={(e) => setHasYield(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950"
            />
            <div>
              <span className="text-xs font-semibold text-zinc-950 block">Tabungan Berimbal Hasil (RDPU / Deposito)</span>
              <span className="text-[11px] text-zinc-500 block">
                Pilih jika tabungan ditempatkan pada instrumen investasi seperti RDPU atau deposito yang menghasilkan bunga berkala.
              </span>
            </div>
          </label>

          {hasYield && (
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Nama Platform / Reksa Dana (Opsional)</label>
              <Input
                type="text"
                placeholder="Contoh: Bibit - Sucorinvest Sharia Money Market, Deposito Seabank"
                value={yieldNote}
                onChange={(e) => setYieldNote(e.target.value)}
                className="h-9 bg-white"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Target Tanggal / Batas Waktu (Opsional)</label>
          <Input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="h-9"
          />
        </div>

        {/* Pemilihan Ikon */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-2">Pilih Ikon</label>
          <div className="grid grid-cols-5 sm:grid-cols-9 gap-2">
            {AVAILABLE_ICONS.map((item) => {
              const IconComp = item.icon;
              const isSelected = icon === item.name;
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setIcon(item.name)}
                  title={item.label}
                  className={cn(
                    "p-2 flex flex-col items-center justify-center rounded border transition-colors cursor-pointer",
                    isSelected
                      ? "border-zinc-950 bg-zinc-950 text-white"
                      : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
                  )}
                >
                  <IconComp className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Pemilihan Warna Solid */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-2">Pilih Aksen Warna</label>
          <div className="flex items-center gap-2">
            {AVAILABLE_COLORS.map((item) => {
              const isSelected = color === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setColor(item.value)}
                  title={item.name}
                  className={cn(
                    "h-6 w-6 rounded-full border transition-transform cursor-pointer",
                    isSelected ? "ring-2 ring-zinc-950 ring-offset-2 scale-110" : "border-zinc-300"
                  )}
                  style={{ backgroundColor: item.value }}
                />
              );
            })}
          </div>
        </div>

        <Button
          type="submit"
          disabled={isCreating}
          className="w-full h-10 mt-6 bg-zinc-950 text-white hover:bg-zinc-800"
        >
          {isCreating ? "Menyimpan..." : "Buat Target Tabungan"}
        </Button>
      </form>
    </>
  );
}

export function SavingsModal({ open, onOpenChange }: SavingsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        {open && <SavingsForm onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}


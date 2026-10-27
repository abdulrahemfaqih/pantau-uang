"use client";

import * as React from "react";
import { useAccounts } from "@/hooks/use-accounts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRupiah, parseRupiahInput } from "@/lib/utils";
import { Plus, EyeOff, Trash2, Landmark, Wallet, CreditCard, Banknote } from "lucide-react";

const MUTED_COLORS = [
  { name: "Slate", hex: "#475569" },
  { name: "Stone", hex: "#57534E" },
  { name: "Amber", hex: "#B45309" },
  { name: "Emerald", hex: "#047857" },
  { name: "Indigo", hex: "#4338CA" },
  { name: "Rose", hex: "#BE123C" },
];

export default function AccountsPage() {
  const { data: accounts = [], isLoading, createAccount, deleteAccount, isCreating } = useAccounts();
  const [modalOpen, setModalOpen] = React.useState(false);

  // Form states
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<"BANK" | "EWALLET" | "CASH" | "CREDIT_CARD">("BANK");
  const [initialBalanceDisplay, setInitialBalanceDisplay] = React.useState("");
  const [initialBalance, setInitialBalance] = React.useState(0);
  const [color, setColor] = React.useState(MUTED_COLORS[0].hex);
  const [excludeFromTotal, setExcludeFromTotal] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleOpenModal = () => {
    setName("");
    setType("BANK");
    setInitialBalanceDisplay("");
    setInitialBalance(0);
    setColor(MUTED_COLORS[0].hex);
    setExcludeFromTotal(false);
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const parsed = parseRupiahInput(rawVal);
    setInitialBalance(parsed);
    setInitialBalanceDisplay(parsed > 0 ? formatRupiah(parsed) : "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg("Nama rekening wajib diisi");
      return;
    }

    try {
      await createAccount({
        name: name.trim(),
        type,
        initialBalance,
        color,
        icon: type === "BANK" ? "Landmark" : type === "EWALLET" ? "Wallet" : type === "CREDIT_CARD" ? "CreditCard" : "Banknote",
        excludeFromTotal,
      });
      setModalOpen(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Gagal membuat rekening baru");
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus rekening ini? Seluruh transaksi yang terkait juga akan dihapus.")) {
      await deleteAccount(id);
    }
  };

  const getAccountIcon = (accType: string) => {
    switch (accType) {
      case "BANK":
        return Landmark;
      case "EWALLET":
        return Wallet;
      case "CREDIT_CARD":
        return CreditCard;
      default:
        return Banknote;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Manajemen Rekening</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Kelola rekening bank, dompet digital, tunai, dan kartu kredit.</p>
        </div>
        <Button
          onClick={handleOpenModal}
          className="flex items-center gap-1.5 bg-zinc-950 text-white hover:bg-zinc-800 text-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Rekening</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : accounts.length === 0 ? (
        <Card className="p-10 text-center text-xs text-zinc-400">
          Belum ada rekening dibuat. Tekan tombol Tambah Rekening untuk memulai.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => {
            const Icon = getAccountIcon(acc.type);
            return (
              <Card
                key={acc.id}
                className="p-5 flex flex-col justify-between border border-zinc-200 shadow-none"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="p-2 rounded-md flex items-center justify-center border"
                        style={{
                          backgroundColor: `${acc.color || "#09090B"}15`,
                          borderColor: `${acc.color || "#09090B"}30`,
                          color: acc.color || "#09090B",
                        }}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-zinc-950 text-sm">{acc.name}</h4>
                        <span className="text-[10px] uppercase font-mono text-zinc-500">
                          {acc.type}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(acc.id)}
                      className="p-1.5 rounded text-zinc-400 hover:text-red-700 transition-colors"
                      title="Hapus rekening"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-5">
                    <span className="text-[11px] text-zinc-500">Saldo Saat Ini</span>
                    <div className="text-2xl font-bold tracking-tight text-zinc-950 tabular-nums">
                      {formatRupiah(Number(acc.currentBalance))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
                  <span className="tabular-nums">
                    Saldo Awal: {formatRupiah(Number(acc.initialBalance))}
                  </span>
                  {acc.excludeFromTotal ? (
                    <span className="flex items-center gap-1 text-amber-700" title="Tidak dijumlahkan ke Total Saldo Gabungan">
                      <EyeOff className="h-3 w-3" />
                      <span>Sembunyi</span>
                    </span>
                  ) : (
                    <span className="text-zinc-400">Termasuk di Total</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Tambah Rekening */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Rekening Baru</DialogTitle>
          </DialogHeader>

          {errorMsg && (
            <div className="p-2.5 text-xs text-red-800 bg-red-50 border border-red-200 rounded-md">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-3 space-y-4 text-xs">
            <div>
              <label className="block font-medium text-zinc-700 mb-1">Nama Rekening</label>
              <Input
                type="text"
                placeholder="Contoh: BCA Utama, GoPay, Tunai"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-zinc-700 mb-1">Tipe Rekening</label>
                <Select
                  value={type}
                  onChange={(e) => setType(e.target.value as "BANK" | "EWALLET" | "CASH" | "CREDIT_CARD")}
                >
                  <option value="BANK">Bank</option>
                  <option value="EWALLET">E-Wallet</option>
                  <option value="CASH">Tunai (Cash)</option>
                  <option value="CREDIT_CARD">Kartu Kredit</option>
                </Select>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Saldo Awal (Rp)</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Rp 0"
                  value={initialBalanceDisplay}
                  onChange={handleBalanceChange}
                  className="h-9 tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-zinc-700 mb-1.5">Warna Aksen Penanda</label>
              <div className="flex items-center gap-3">
                {MUTED_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setColor(c.hex)}
                    className={`h-7 w-7 rounded-full border-2 transition-transform cursor-pointer ${
                      color === c.hex ? "border-zinc-950 scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={excludeFromTotal}
                  onChange={(e) => setExcludeFromTotal(e.target.checked)}
                  className="mt-0.5 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950"
                />
                <div>
                  <span className="font-medium text-zinc-900">Sembunyikan dari Total Saldo</span>
                  <p className="text-zinc-500 text-[11px] mt-0.5">
                    Saldo rekening ini tetap tampil di daftar, tetapi tidak dijumlahkan ke Total Saldo Gabungan Dashboard (misal: Rekening Tabungan atau Dana Darurat).
                  </p>
                </div>
              </label>
            </div>

            <Button
              type="submit"
              disabled={isCreating}
              className="w-full h-10 mt-6 bg-zinc-950 text-white hover:bg-zinc-800"
            >
              {isCreating ? "Menyimpan..." : "Simpan Rekening"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

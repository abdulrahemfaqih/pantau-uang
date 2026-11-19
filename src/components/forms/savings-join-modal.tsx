"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSavings } from "@/hooks/use-savings";
import { Users2 } from "lucide-react";

interface SavingsJoinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SavingsJoinForm({ onClose }: { onClose: () => void }) {
  const { joinGoal, isJoining } = useSavings();
  const [inviteCode, setInviteCode] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const clean = inviteCode.trim().toUpperCase();
    if (!clean) {
      setErrorMsg("Kode undangan wajib diisi");
      return;
    }

    try {
      await joinGoal({ inviteCode: clean });
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Gagal bergabung ke tabungan bersama");
      }
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Users2 className="h-5 w-5" />
          <span>Gabung Tabungan Bersama</span>
        </DialogTitle>
      </DialogHeader>

      <p className="text-xs text-zinc-500">
        Masukkan kode undangan yang dibagikan oleh inisiator tabungan bersama (misal pasangan atau teman Anda). Uang fisik Anda tetap disimpan di rekening pribadi Anda sendiri.
      </p>

      {errorMsg && (
        <div className="p-3 text-xs text-red-800 bg-red-50 border border-red-200 rounded-md">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Kode Undangan</label>
          <Input
            autoFocus
            type="text"
            placeholder="Contoh: PU-NIKAH1, PU-X8291"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            className="h-11 font-mono uppercase tracking-wider text-center text-sm font-bold"
          />
        </div>

        <Button
          type="submit"
          disabled={isJoining}
          className="w-full h-10 bg-zinc-950 text-white hover:bg-zinc-800"
        >
          {isJoining ? "Memvalidasi..." : "Gabung Sekarang"}
        </Button>
      </form>
    </>
  );
}

export function SavingsJoinModal({ open, onOpenChange }: SavingsJoinModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && <SavingsJoinForm onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

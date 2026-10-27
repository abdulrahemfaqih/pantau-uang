"use client";

import * as React from "react";
import { useCategories } from "@/hooks/use-categories";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Tag, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CategoriesPage() {
  const { data: categories = [], isLoading, createCategory, deleteCategory, isCreating } = useCategories();
  const [activeTab, setActiveTab] = React.useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [modalOpen, setModalOpen] = React.useState(false);

  // Form states
  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState("#71717A");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const filteredCategories = categories.filter((c) => c.type === activeTab);

  const handleOpenModal = () => {
    setName("");
    setColor("#71717A");
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg("Nama kategori wajib diisi");
      return;
    }

    try {
      await createCategory({
        name: name.trim(),
        type: activeTab,
        color,
        icon: "Tag",
      });
      setModalOpen(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Gagal membuat kategori baru");
      }
    }
  };

  const handleDelete = async (id: string, isSystem: boolean) => {
    if (isSystem) {
      alert("Kategori sistem tidak dapat dihapus.");
      return;
    }
    if (confirm("Hapus kategori ini? Transaksi yang menggunakan kategori ini akan dialihkan ke tanpa kategori.")) {
      await deleteCategory(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Manajemen Kategori</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Kelola kategori pengeluaran dan pemasukan keuangan Anda.</p>
        </div>
        <Button
          onClick={handleOpenModal}
          className="flex items-center gap-1.5 bg-zinc-950 text-white hover:bg-zinc-800 text-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Kategori</span>
        </Button>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-3">
        <button
          onClick={() => setActiveTab("EXPENSE")}
          className={cn(
            "px-4 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer",
            activeTab === "EXPENSE"
              ? "bg-zinc-950 text-white"
              : "bg-zinc-100 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200"
          )}
        >
          Kategori Pengeluaran
        </button>
        <button
          onClick={() => setActiveTab("INCOME")}
          className={cn(
            "px-4 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer",
            activeTab === "INCOME"
              ? "bg-zinc-950 text-white"
              : "bg-zinc-100 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200"
          )}
        >
          Kategori Pemasukan
        </button>
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : filteredCategories.length === 0 ? (
        <Card className="p-8 text-center text-xs text-zinc-400">
          Belum ada kategori untuk tipe ini.
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredCategories.map((cat) => (
            <Card key={cat.id} className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-700">
                  <Tag className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-semibold text-zinc-950 text-xs flex items-center gap-1.5">
                    <span>{cat.name}</span>
                    {cat.isSystem && (
                      <span title="Kategori Sistem">
                        <Lock className="h-3 w-3 text-zinc-400" />
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {cat.isSystem ? "Bawaan Sistem" : "Kustom"}
                  </span>
                </div>
              </div>

              {!cat.isSystem && (
                <button
                  onClick={() => handleDelete(cat.id, cat.isSystem)}
                  className="p-1.5 rounded text-zinc-400 hover:text-red-700 transition-colors"
                  title="Hapus Kategori"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Modal Tambah Kategori */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Tambah Kategori {activeTab === "EXPENSE" ? "Pengeluaran" : "Pemasukan"}
            </DialogTitle>
          </DialogHeader>

          {errorMsg && (
            <div className="p-2.5 text-xs text-red-800 bg-red-50 border border-red-200 rounded-md">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-3 space-y-4 text-xs">
            <div>
              <label className="block font-medium text-zinc-700 mb-1">Nama Kategori</label>
              <Input
                type="text"
                placeholder="Contoh: Langganan Software, Investasi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9"
              />
            </div>

            <Button
              type="submit"
              disabled={isCreating}
              className="w-full h-10 mt-6 bg-zinc-950 text-white hover:bg-zinc-800"
            >
              {isCreating ? "Menyimpan..." : "Simpan Kategori"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

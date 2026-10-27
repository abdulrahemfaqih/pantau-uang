import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RecurringTransaction, Account, Category } from "@/db/schema";
import { RecurringFormValues } from "@/lib/validations";

export interface RecurringWithDetails extends RecurringTransaction {
  account?: Account;
  toAccount?: Account | null;
  category?: Category | null;
}

export function useRecurring() {
  const queryClient = useQueryClient();

  const recurringQuery = useQuery<RecurringWithDetails[]>({
    queryKey: ["recurring-transactions"],
    queryFn: async () => {
      const res = await fetch("/api/recurring");
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Gagal memuat jadwal transaksi berulang");
      }
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: RecurringFormValues) => {
      const res = await fetch("/api/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Gagal membuat jadwal transaksi berulang");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-transactions"] });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/recurring/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Gagal memperbarui status transaksi berulang");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-transactions"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/recurring/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Gagal menghapus jadwal transaksi berulang");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-transactions"] });
    },
  });

  return {
    ...recurringQuery,
    createRecurring: createMutation.mutateAsync,
    toggleActive: toggleActiveMutation.mutateAsync,
    deleteRecurring: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isToggling: toggleActiveMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

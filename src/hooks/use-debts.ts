import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Debt, DebtPayment, Account } from "@/db/schema";
import { DebtFormValues, DebtPaymentFormValues } from "@/lib/validations";

export interface DebtPaymentWithAccount extends DebtPayment {
  account?: Account | null;
}

export interface DebtWithPayments extends Debt {
  payments?: DebtPaymentWithAccount[];
}

export interface DebtsResponse {
  debts: DebtWithPayments[];
  summary: {
    totalDebt: number;
    totalLoan: number;
  };
}

export function useDebts() {
  const queryClient = useQueryClient();

  const debtsQuery = useQuery<DebtsResponse>({
    queryKey: ["debts"],
    queryFn: async () => {
      const res = await fetch("/api/debts");
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Gagal memuat daftar hutang & piutang");
      }
      return res.json();
    },
  });

  const createDebtMutation = useMutation({
    mutationFn: async (data: DebtFormValues) => {
      const res = await fetch("/api/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Gagal menambahkan catatan hutang/piutang");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
    },
  });

  const deleteDebtMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/debts/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Gagal menghapus catatan hutang/piutang");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async ({ debtId, data }: { debtId: string; data: DebtPaymentFormValues }) => {
      const res = await fetch(`/api/debts/${debtId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Gagal mencatat pembayaran");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });

  return {
    ...debtsQuery,
    createDebt: createDebtMutation.mutateAsync,
    deleteDebt: deleteDebtMutation.mutateAsync,
    recordPayment: recordPaymentMutation.mutateAsync,
    isCreating: createDebtMutation.isPending,
    isDeleting: deleteDebtMutation.isPending,
    isPaying: recordPaymentMutation.isPending,
  };
}

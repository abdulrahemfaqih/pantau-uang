import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SavingsGoal, SavingsMember, SavingsTransaction, Account } from "@/db/schema";
import { SavingsGoalFormValues, SavingsJoinFormValues } from "@/lib/validations";

export interface SavingsMemberWithUser extends SavingsMember {
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  } | null;
  contributionAmount: number;
  contributionPercentage: number;
}

export interface SavingsTransactionWithDetails extends SavingsTransaction {
  user?: {
    id: string;
    name: string;
    image?: string | null;
  } | null;
  fromAccount?: Account | null;
  toAccount?: Account | null;
}

export interface SavingsGoalWithDetails extends SavingsGoal {
  currentAmount: number;
  principalAmount?: number;
  myContribution: number;
  myPrincipal?: number;
  myYield?: number;
  percentage: number;
  isOwner: boolean;
  role?: string;
  currentUserId?: string;
  linkedAccount?: Account | null;
  owner?: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  } | null;
  membersCount: number;
  members: SavingsMemberWithUser[];
  recentTransactions?: SavingsTransactionWithDetails[];
  transactions?: SavingsTransactionWithDetails[];
}

export interface SavingsResponse {
  savings: SavingsGoalWithDetails[];
  summary: {
    totalSaved: number;
    myTotalSaved: number;
    activeGoalsCount: number;
  };
}

export function useSavings() {
  const queryClient = useQueryClient();

  const savingsQuery = useQuery<SavingsResponse>({
    queryKey: ["savings"],
    queryFn: async () => {
      const res = await fetch("/api/savings");
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Gagal memuat daftar tabungan");
      }
      return res.json();
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: async (data: SavingsGoalFormValues) => {
      const res = await fetch("/api/savings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Gagal membuat target tabungan");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SavingsGoalFormValues & { status: string }> }) => {
      const res = await fetch(`/api/savings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Gagal memperbarui tabungan");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["savings"] });
      queryClient.invalidateQueries({ queryKey: ["savings", variables.id] });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/savings/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Gagal menghapus tabungan");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });

  const recordTransactionMutation = useMutation({
    mutationFn: async ({
      goalId,
      data,
    }: {
      goalId: string;
      data: {
        type: "DEPOSIT" | "WITHDRAW" | "YIELD";
        amount: number;
        accountId?: string | null;
        note?: string | null;
        date?: Date;
      };
    }) => {
      const res = await fetch(`/api/savings/${goalId}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Gagal memproses transaksi tabungan");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["savings"] });
      queryClient.invalidateQueries({ queryKey: ["savings", variables.goalId] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });

  const joinGoalMutation = useMutation({
    mutationFn: async (data: SavingsJoinFormValues) => {
      const res = await fetch("/api/savings/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Gagal bergabung ke tabungan");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });

  return {
    ...savingsQuery,
    createGoal: createGoalMutation.mutateAsync,
    updateGoal: updateGoalMutation.mutateAsync,
    deleteGoal: deleteGoalMutation.mutateAsync,
    recordTransaction: recordTransactionMutation.mutateAsync,
    joinGoal: joinGoalMutation.mutateAsync,
    isCreating: createGoalMutation.isPending,
    isUpdating: updateGoalMutation.isPending,
    isDeleting: deleteGoalMutation.isPending,
    isTransacting: recordTransactionMutation.isPending,
    isJoining: joinGoalMutation.isPending,
  };
}

export function useSavingsDetail(id: string) {
  return useQuery<SavingsGoalWithDetails>({
    queryKey: ["savings", id],
    queryFn: async () => {
      const res = await fetch(`/api/savings/${id}`);
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Gagal memuat detail tabungan");
      }
      return res.json();
    },
    enabled: Boolean(id),
  });
}



import { useQuery } from "@tanstack/react-query";
import { TransactionWithDetails } from "./use-transactions";
import { Account } from "@/db/schema";

export interface DashboardSummaryData {
  totalBalance: number;
  hiddenAccountsCount: number;
  monthlyIncome: number;
  monthlyExpense: number;
  netCashflow: number;
  categoryExpenses: Array<{
    id: string;
    name: string;
    color: string;
    icon: string;
    total: number;
    percentage: number;
  }>;
  monthlyTrends: Array<{
    label: string;
    income: number;
    expense: number;
  }>;
  recentTransactions: TransactionWithDetails[];
  accountsSummary: Account[];
}

export function useDashboardSummary(month: number, year: number) {
  return useQuery<DashboardSummaryData>({
    queryKey: ["dashboard-summary", month, year],
    queryFn: async () => {
      const res = await fetch(`/api/analytics?month=${month}&year=${year}`);
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Gagal memuat ringkasan dashboard");
      }
      return res.json();
    },
    placeholderData: (previousData) => previousData,
  });
}

import { useQuery } from "@tanstack/react-query";

export interface DailyStatisticItem {
  day: number;
  label: string;
  fullDate: string;
  expense: number;
  income: number;
  txCount: number;
}

export interface MonthlyStatisticItem {
  month: number;
  label: string;
  fullLabel: string;
  expense: number;
  income: number;
  txCount: number;
}

export interface YearlyStatisticItem {
  year: number;
  label: string;
  expense: number;
  income: number;
  txCount: number;
}

export interface DailyStatisticsData {
  viewType: "daily";
  month: number;
  year: number;
  monthName: string;
  totalDays: number;
  totalExpense: number;
  totalIncome: number;
  netCashflow: number;
  averageExpense: number;
  activeDaysCount: number;
  peakDay: { day: number; label: string; fullDate: string; amount: number } | null;
  dailyData: DailyStatisticItem[];
  topExpenseDays: DailyStatisticItem[];
  categoryBreakdown: Array<{ name: string; color: string; total: number; percentage: number }>;
}

export interface MonthlyStatisticsData {
  viewType: "monthly";
  year: number;
  totalExpense: number;
  totalIncome: number;
  netCashflow: number;
  averageExpense: number;
  activeMonthsCount: number;
  peakMonth: { month: number; label: string; fullLabel: string; amount: number } | null;
  monthlyData: MonthlyStatisticItem[];
}

export interface YearlyStatisticsData {
  viewType: "yearly";
  totalExpense: number;
  totalIncome: number;
  netCashflow: number;
  averageExpense: number;
  peakYear: { year: number; amount: number } | null;
  yearlyData: YearlyStatisticItem[];
}

export type StatisticsData = DailyStatisticsData | MonthlyStatisticsData | YearlyStatisticsData;

export function useStatistics(type: "daily" | "monthly" | "yearly", month?: number, year?: number) {
  return useQuery<StatisticsData>({
    queryKey: ["statistics", type, year, month],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.append("type", type);
      if (month) searchParams.append("month", String(month));
      if (year) searchParams.append("year", String(year));

      const res = await fetch(`/api/statistics?${searchParams.toString()}`);
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Gagal memuat statistik");
      }
      return res.json();
    },
    placeholderData: (previousData) => previousData,
  });
}


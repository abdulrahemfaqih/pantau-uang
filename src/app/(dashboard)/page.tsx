"use client";

import * as React from "react";
import { useDashboardSummary } from "@/hooks/use-dashboard";
import { StatCards } from "@/components/dashboard/stat-cards";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { AccountsCard } from "@/components/dashboard/accounts-card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function DashboardPage() {
  const [currentDate, setCurrentDate] = React.useState<Date>(() => new Date());

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();
  const monthName = format(currentDate, "MMMM yyyy", { locale: localeId });

  const { data, isLoading, error } = useDashboardSummary(month, year);

  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
    <div className="space-y-6">
      {/* Page Header (No Eyebrow text, clean & direct) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Dashboard</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Ringkasan arus kas keuangan Anda.</p>
        </div>

        {/* Month Navigation Control */}
        <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-md p-1 self-start sm:self-auto">
          <button
            onClick={handlePrevMonth}
            className="p-1 rounded text-zinc-600 hover:text-zinc-950 hover:bg-white transition-colors cursor-pointer"
            aria-label="Bulan Sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-3 text-xs font-semibold text-zinc-900 capitalize tabular-nums">
            {monthName}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1 rounded text-zinc-600 hover:text-zinc-950 hover:bg-white transition-colors cursor-pointer"
            aria-label="Bulan Berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <Skeleton className="lg:col-span-7 h-80 w-full" />
            <Skeleton className="lg:col-span-5 h-80 w-full" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <Skeleton className="lg:col-span-7 h-72 w-full" />
            <Skeleton className="lg:col-span-5 h-72 w-full" />
          </div>
        </div>
      ) : error ? (
        <div className="p-4 rounded-md border border-red-200 bg-red-50 text-red-800 text-xs">
          Terjadi kesalahan saat memuat data: {(error as Error).message}
        </div>
      ) : data ? (
        <div className="space-y-4">
          {/* Bento Grid Row 1: Stat Cards */}
          <StatCards
            totalBalance={data.totalBalance}
            hiddenAccountsCount={data.hiddenAccountsCount}
            monthlyIncome={data.monthlyIncome}
            monthlyExpense={data.monthlyExpense}
            netCashflow={data.netCashflow}
            currentMonthName={format(currentDate, "MMMM", { locale: localeId })}
          />

          {/* Bento Grid Row 2: 6-Month Trend & Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7">
              <TrendChart data={data.monthlyTrends} />
            </div>
            <div className="lg:col-span-5">
              <CategoryBreakdown categories={data.categoryExpenses} />
            </div>
          </div>

          {/* Bento Grid Row 3: Recent Transactions & Accounts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7">
              <RecentTransactions transactions={data.recentTransactions} />
            </div>
            <div className="lg:col-span-5">
              <AccountsCard accounts={data.accountsSummary} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

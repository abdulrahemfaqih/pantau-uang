"use client";

import * as React from "react";
import {
  useStatistics,
  DailyStatisticsData,
  MonthlyStatisticsData,
  YearlyStatisticsData,
} from "@/hooks/use-statistics";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatRupiah } from "@/lib/utils";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Calendar,
  CalendarDays,
  CalendarRange,
  Flame,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

type TabType = "daily" | "monthly" | "yearly";

export default function StatisticsPage() {
  const [activeTab, setActiveTab] = React.useState<TabType>("daily");
  const [currentDate, setCurrentDate] = React.useState<Date>(() => new Date());

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();
  const monthName = format(currentDate, "MMMM yyyy", { locale: localeId });

  const { data, isLoading, error } = useStatistics(activeTab, month, year);

  const handlePrev = () => {
    if (activeTab === "daily") {
      setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    } else if (activeTab === "monthly") {
      setCurrentDate((prev) => new Date(prev.getFullYear() - 1, prev.getMonth(), 1));
    }
  };

  const handleNext = () => {
    if (activeTab === "daily") {
      setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    } else if (activeTab === "monthly") {
      setCurrentDate((prev) => new Date(prev.getFullYear() + 1, prev.getMonth(), 1));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Statistik Pengeluaran</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Analisis visual grafik arus kas dan ritme belanja Anda.</p>
        </div>

        {/* Tab Selector & Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Segmented Control */}
          <div className="inline-flex items-center p-1 bg-zinc-100 rounded-md border border-zinc-200">
            <button
              onClick={() => setActiveTab("daily")}
              className={cn(
                "px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer",
                activeTab === "daily"
                  ? "bg-zinc-950 text-white shadow-none"
                  : "text-zinc-600 hover:text-zinc-950"
              )}
            >
              Harian (1-31)
            </button>
            <button
              onClick={() => setActiveTab("monthly")}
              className={cn(
                "px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer",
                activeTab === "monthly"
                  ? "bg-zinc-950 text-white shadow-none"
                  : "text-zinc-600 hover:text-zinc-950"
              )}
            >
              Bulanan
            </button>
            <button
              onClick={() => setActiveTab("yearly")}
              className={cn(
                "px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer",
                activeTab === "yearly"
                  ? "bg-zinc-950 text-white shadow-none"
                  : "text-zinc-600 hover:text-zinc-950"
              )}
            >
              Tahunan
            </button>
          </div>

          {/* Period Navigator */}
          {activeTab !== "yearly" && (
            <div className="flex items-center gap-1 bg-zinc-50 border border-zinc-200 rounded-md p-1">
              <button
                onClick={handlePrev}
                className="p-1 rounded text-zinc-600 hover:text-zinc-950 hover:bg-white transition-colors cursor-pointer"
                aria-label="Periode Sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2.5 text-xs font-semibold text-zinc-900 capitalize tabular-nums">
                {activeTab === "daily" ? monthName : `Tahun ${year}`}
              </span>
              <button
                onClick={handleNext}
                className="p-1 rounded text-zinc-600 hover:text-zinc-950 hover:bg-white transition-colors cursor-pointer"
                aria-label="Periode Berikutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      ) : error ? (
        <div className="p-4 rounded-md border border-red-200 bg-red-50 text-red-800 text-xs">
          Terjadi kesalahan saat memuat statistik: {(error as Error).message}
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* TAB 1: HARIAN */}
          {activeTab === "daily" && (() => {
            const daily = data as DailyStatisticsData;
            return (
              <>
                {/* 4 Kartu Metrik Harian */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Card className="p-4 bg-white border border-zinc-200 shadow-none">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500 font-medium">Total Pengeluaran</span>
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="mt-2 text-xl font-bold text-red-700 tabular-nums">
                      -{formatRupiah(daily.totalExpense)}
                    </div>
                    <span className="text-[11px] text-zinc-400 mt-1 block">
                      Periode {daily.monthName}
                    </span>
                  </Card>

                  <Card className="p-4 bg-white border border-zinc-200 shadow-none">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500 font-medium">Rata-rata / Hari</span>
                      <CalendarDays className="h-4 w-4 text-zinc-500" />
                    </div>
                    <div className="mt-2 text-xl font-bold text-zinc-950 tabular-nums">
                      {formatRupiah(daily.averageExpense)}
                    </div>
                    <span className="text-[11px] text-zinc-400 mt-1 block">
                      Berdasarkan {daily.totalDays} hari kalender
                    </span>
                  </Card>

                  <Card className="p-4 bg-white border border-zinc-200 shadow-none">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500 font-medium">Hari Terboros</span>
                      <Flame className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="mt-2 text-xl font-bold text-zinc-950 tabular-nums">
                      {daily.peakDay ? formatRupiah(daily.peakDay.amount) : "Rp 0"}
                    </div>
                    <span className="text-[11px] text-zinc-500 mt-1 block truncate">
                      {daily.peakDay ? daily.peakDay.fullDate : "Belum ada transaksi"}
                    </span>
                  </Card>

                  <Card className="p-4 bg-white border border-zinc-200 shadow-none">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500 font-medium">Arus Kas Bersih</span>
                      {daily.netCashflow >= 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div
                      className={cn(
                        "mt-2 text-xl font-bold tabular-nums",
                        daily.netCashflow >= 0 ? "text-emerald-700" : "text-red-700"
                      )}
                    >
                      {daily.netCashflow >= 0 ? "+" : ""}
                      {formatRupiah(daily.netCashflow)}
                    </div>
                    <span className="text-[11px] text-zinc-400 mt-1 block">
                      Pemasukan: +{formatRupiah(daily.totalIncome)}
                    </span>
                  </Card>
                </div>

                {/* Grafik Batang Harian Tanggal 1 s/d 31 */}
                <Card className="border border-zinc-200 shadow-none">
                  <CardHeader className="pb-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <CardTitle className="text-sm font-bold text-zinc-950">
                        Grafik Pengeluaran Harian (Tanggal 1 s/d {daily.totalDays})
                      </CardTitle>
                      <span className="text-xs text-zinc-500 font-mono">
                        Bulan {daily.monthName}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {daily.totalExpense === 0 ? (
                      <div className="h-64 flex items-center justify-center text-xs text-zinc-400">
                        Belum ada catatan pengeluaran di bulan {daily.monthName}.
                      </div>
                    ) : (
                      <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={daily.dailyData}
                            margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4F4F5" />
                            <XAxis
                              dataKey="day"
                              stroke="#71717A"
                              fontSize={11}
                              tickLine={false}
                              axisLine={{ stroke: "#E4E4E7" }}
                              tickFormatter={(val) => `${val}`}
                            />
                            <YAxis
                              stroke="#71717A"
                              fontSize={11}
                              tickLine={false}
                              axisLine={{ stroke: "#E4E4E7" }}
                              tickFormatter={(val) => {
                                if (val >= 1000000) return `${(val / 1000000).toFixed(0)}jt`;
                                if (val >= 1000) return `${(val / 1000).toFixed(0)}rb`;
                                return `${val}`;
                              }}
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const item = payload[0].payload as typeof daily.dailyData[0];
                                  return (
                                    <div className="rounded-md border border-zinc-200 bg-white p-2.5 shadow-none text-xs">
                                      <p className="font-semibold text-zinc-950 mb-1">
                                        {item.fullDate}
                                      </p>
                                      <div className="space-y-0.5 tabular-nums">
                                        <p className="text-red-700 font-bold">
                                          Pengeluaran: -{formatRupiah(item.expense)}
                                        </p>
                                        {item.income > 0 && (
                                          <p className="text-emerald-700">
                                            Pemasukan: +{formatRupiah(item.income)}
                                          </p>
                                        )}
                                        <p className="text-zinc-500 text-[11px]">
                                          {item.txCount} transaksi tercatat
                                        </p>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar
                              dataKey="expense"
                              name="Pengeluaran"
                              fill="#18181B"
                              radius={[2, 2, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 2 Kolom: Top 5 Hari Terboros & Komposisi Kategori */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Top 5 Hari Pengeluaran Tertinggi */}
                  <Card className="border border-zinc-200 shadow-none">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-bold text-zinc-950">
                        Top 5 Hari Pengeluaran Tertinggi
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {daily.topExpenseDays.length === 0 ? (
                        <p className="text-xs text-zinc-400">Belum ada data pengeluaran.</p>
                      ) : (
                        <div className="divide-y divide-zinc-100">
                          {daily.topExpenseDays.map((d, idx) => (
                            <div
                              key={d.day}
                              className="py-2.5 flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="h-6 w-6 rounded bg-zinc-100 text-zinc-900 font-bold flex items-center justify-center text-[11px] tabular-nums shrink-0">
                                  #{idx + 1}
                                </span>
                                <div>
                                  <div className="font-semibold text-zinc-950">{d.fullDate}</div>
                                  <div className="text-[11px] text-zinc-500">
                                    {d.txCount} transaksi
                                  </div>
                                </div>
                              </div>
                              <div className="font-bold text-red-700 tabular-nums">
                                -{formatRupiah(d.expense)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Komposisi Kategori */}
                  <Card className="border border-zinc-200 shadow-none">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-bold text-zinc-950">
                        Pos Belanja Terbesar
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {daily.categoryBreakdown.length === 0 ? (
                        <p className="text-xs text-zinc-400">Belum ada data kategori.</p>
                      ) : (
                        <div className="space-y-3">
                          {daily.categoryBreakdown.slice(0, 5).map((cat) => (
                            <div key={cat.name} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-zinc-800">{cat.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-zinc-500 tabular-nums">
                                    {cat.percentage}%
                                  </span>
                                  <span className="font-semibold text-zinc-950 tabular-nums">
                                    {formatRupiah(cat.total)}
                                  </span>
                                </div>
                              </div>
                              <div className="h-1.5 w-full bg-zinc-100 rounded-none overflow-hidden">
                                <div
                                  className="h-full bg-zinc-950 transition-all duration-300"
                                  style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            );
          })()}

          {/* TAB 2: BULANAN */}
          {activeTab === "monthly" && (() => {
            const monthly = data as MonthlyStatisticsData;
            return (
              <>
                {/* 3 Kartu Metrik Bulanan */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Card className="p-4 bg-white border border-zinc-200 shadow-none">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500 font-medium">Total Pengeluaran ({monthly.year})</span>
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="mt-2 text-xl font-bold text-red-700 tabular-nums">
                      -{formatRupiah(monthly.totalExpense)}
                    </div>
                    <span className="text-[11px] text-zinc-400 mt-1 block">
                      Akumulasi 12 bulan
                    </span>
                  </Card>

                  <Card className="p-4 bg-white border border-zinc-200 shadow-none">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500 font-medium">Rata-rata / Bulan</span>
                      <CalendarRange className="h-4 w-4 text-zinc-500" />
                    </div>
                    <div className="mt-2 text-xl font-bold text-zinc-950 tabular-nums">
                      {formatRupiah(monthly.averageExpense)}
                    </div>
                    <span className="text-[11px] text-zinc-400 mt-1 block">
                      Dari {monthly.activeMonthsCount} bulan aktif
                    </span>
                  </Card>

                  <Card className="p-4 bg-white border border-zinc-200 shadow-none">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500 font-medium">Bulan Terboros</span>
                      <Flame className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="mt-2 text-xl font-bold text-zinc-950 tabular-nums">
                      {monthly.peakMonth ? formatRupiah(monthly.peakMonth.amount) : "Rp 0"}
                    </div>
                    <span className="text-[11px] text-zinc-500 mt-1 block truncate">
                      {monthly.peakMonth ? monthly.peakMonth.fullLabel : "Belum ada transaksi"}
                    </span>
                  </Card>
                </div>

                {/* Grafik 12 Bulan (Jan - Des) */}
                <Card className="border border-zinc-200 shadow-none">
                  <CardHeader className="pb-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <CardTitle className="text-sm font-bold text-zinc-950">
                        Perbandingan Arus Kas 12 Bulan ({monthly.year})
                      </CardTitle>
                      <span className="text-xs text-zinc-500 font-mono">Januari s/d Desember</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={monthly.monthlyData}
                          margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4F4F5" />
                          <XAxis
                            dataKey="label"
                            stroke="#71717A"
                            fontSize={11}
                            tickLine={false}
                            axisLine={{ stroke: "#E4E4E7" }}
                          />
                          <YAxis
                            stroke="#71717A"
                            fontSize={11}
                            tickLine={false}
                            axisLine={{ stroke: "#E4E4E7" }}
                            tickFormatter={(val) => {
                              if (val >= 1000000) return `${(val / 1000000).toFixed(0)}jt`;
                              if (val >= 1000) return `${(val / 1000).toFixed(0)}rb`;
                              return `${val}`;
                            }}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const item = payload[0].payload as typeof monthly.monthlyData[0];
                                return (
                                  <div className="rounded-md border border-zinc-200 bg-white p-2.5 shadow-none text-xs">
                                    <p className="font-semibold text-zinc-950 mb-1">
                                      {item.fullLabel}
                                    </p>
                                    <div className="space-y-0.5 tabular-nums">
                                      <p className="text-red-700 font-bold">
                                        Pengeluaran: -{formatRupiah(item.expense)}
                                      </p>
                                      <p className="text-emerald-700 font-bold">
                                        Pemasukan: +{formatRupiah(item.income)}
                                      </p>
                                      <p className="text-zinc-500 text-[11px]">
                                        {item.txCount} transaksi
                                      </p>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend
                            verticalAlign="top"
                            align="right"
                            iconType="circle"
                            wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }}
                          />
                          <Bar
                            dataKey="income"
                            name="Pemasukan"
                            fill="#16A34A"
                            radius={[2, 2, 0, 0]}
                          />
                          <Bar
                            dataKey="expense"
                            name="Pengeluaran"
                            fill="#18181B"
                            radius={[2, 2, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabel Rincian 12 Bulan */}
                <Card className="border border-zinc-200 shadow-none overflow-hidden">
                  <div className="bg-zinc-50 px-4 py-3 border-b border-zinc-200">
                    <h3 className="text-xs font-bold text-zinc-950">Tabel Arus Kas Bulanan</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-zinc-200 text-zinc-500 font-medium">
                        <tr>
                          <th className="py-2.5 px-4">Bulan</th>
                          <th className="py-2.5 px-4 text-right">Pemasukan</th>
                          <th className="py-2.5 px-4 text-right">Pengeluaran</th>
                          <th className="py-2.5 px-4 text-right">Arus Bersih</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 tabular-nums">
                        {monthly.monthlyData.map((m) => {
                          const net = m.income - m.expense;
                          return (
                            <tr key={m.month} className="hover:bg-zinc-50/70">
                              <td className="py-2.5 px-4 font-medium text-zinc-950">
                                {m.fullLabel}
                              </td>
                              <td className="py-2.5 px-4 text-right text-emerald-700">
                                +{formatRupiah(m.income)}
                              </td>
                              <td className="py-2.5 px-4 text-right text-red-700">
                                -{formatRupiah(m.expense)}
                              </td>
                              <td
                                className={cn(
                                  "py-2.5 px-4 text-right font-semibold",
                                  net >= 0 ? "text-zinc-950" : "text-red-700"
                                )}
                              >
                                {net >= 0 ? "+" : ""}
                                {formatRupiah(net)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </>
            );
          })()}

          {/* TAB 3: TAHUNAN */}
          {activeTab === "yearly" && (() => {
            const yearly = data as YearlyStatisticsData;
            return (
              <>
                {/* 3 Kartu Metrik Tahunan */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Card className="p-4 bg-white border border-zinc-200 shadow-none">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500 font-medium">Total Akumulasi Pengeluaran</span>
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="mt-2 text-xl font-bold text-red-700 tabular-nums">
                      -{formatRupiah(yearly.totalExpense)}
                    </div>
                    <span className="text-[11px] text-zinc-400 mt-1 block">
                      Seluruh tahun tercatat
                    </span>
                  </Card>

                  <Card className="p-4 bg-white border border-zinc-200 shadow-none">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500 font-medium">Rata-rata / Tahun</span>
                      <Calendar className="h-4 w-4 text-zinc-500" />
                    </div>
                    <div className="mt-2 text-xl font-bold text-zinc-950 tabular-nums">
                      {formatRupiah(yearly.averageExpense)}
                    </div>
                    <span className="text-[11px] text-zinc-400 mt-1 block">
                      Dari {yearly.yearlyData.length} tahun pencatatan
                    </span>
                  </Card>

                  <Card className="p-4 bg-white border border-zinc-200 shadow-none">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500 font-medium">Tahun Terboros</span>
                      <Flame className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="mt-2 text-xl font-bold text-zinc-950 tabular-nums">
                      {yearly.peakYear ? formatRupiah(yearly.peakYear.amount) : "Rp 0"}
                    </div>
                    <span className="text-[11px] text-zinc-500 mt-1 block">
                      {yearly.peakYear ? `Tahun ${yearly.peakYear.year}` : "Belum ada transaksi"}
                    </span>
                  </Card>
                </div>

                {/* Grafik Perbandingan Tahun */}
                <Card className="border border-zinc-200 shadow-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold text-zinc-950">
                      Tren Arus Kas Tahunan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={yearly.yearlyData}
                          margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4F4F5" />
                          <XAxis
                            dataKey="label"
                            stroke="#71717A"
                            fontSize={11}
                            tickLine={false}
                            axisLine={{ stroke: "#E4E4E7" }}
                          />
                          <YAxis
                            stroke="#71717A"
                            fontSize={11}
                            tickLine={false}
                            axisLine={{ stroke: "#E4E4E7" }}
                            tickFormatter={(val) => {
                              if (val >= 1000000) return `${(val / 1000000).toFixed(0)}jt`;
                              if (val >= 1000) return `${(val / 1000).toFixed(0)}rb`;
                              return `${val}`;
                            }}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const item = payload[0].payload as typeof yearly.yearlyData[0];
                                return (
                                  <div className="rounded-md border border-zinc-200 bg-white p-2.5 shadow-none text-xs">
                                    <p className="font-semibold text-zinc-950 mb-1">
                                      Tahun {item.year}
                                    </p>
                                    <div className="space-y-0.5 tabular-nums">
                                      <p className="text-red-700 font-bold">
                                        Pengeluaran: -{formatRupiah(item.expense)}
                                      </p>
                                      <p className="text-emerald-700 font-bold">
                                        Pemasukan: +{formatRupiah(item.income)}
                                      </p>
                                      <p className="text-zinc-500 text-[11px]">
                                        {item.txCount} total transaksi
                                      </p>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend
                            verticalAlign="top"
                            align="right"
                            iconType="circle"
                            wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }}
                          />
                          <Bar
                            dataKey="income"
                            name="Pemasukan"
                            fill="#16A34A"
                            radius={[2, 2, 0, 0]}
                          />
                          <Bar
                            dataKey="expense"
                            name="Pengeluaran"
                            fill="#18181B"
                            radius={[2, 2, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </>
            );
          })()}
        </div>
      ) : null}
    </div>
  );
}


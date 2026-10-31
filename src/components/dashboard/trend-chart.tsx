"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatRupiah } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export interface TrendItem {
  label: string;
  fullLabel?: string;
  income: number;
  expense: number;
}

interface TrendChartProps {
  data: TrendItem[];
  monthName?: string;
}

export function TrendChart({ data, monthName }: TrendChartProps) {
  const hasData = data && data.some((item) => item.income > 0 || item.expense > 0);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Arus Kas Mingguan</CardTitle>
          <span className="text-xs text-zinc-500 font-mono">
            {monthName ? `${monthName}` : "Bulan Berjalan"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-[280px] pt-4">
        {!hasData ? (
          <div className="h-full flex items-center justify-center min-h-[220px] text-zinc-400 text-xs">
            Belum ada mutasi arus kas di bulan ini.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as TrendItem;
                    const incomeVal = Number(payload[0]?.value || 0);
                    const expenseVal = Number(payload[1]?.value || 0);
                    const net = incomeVal - expenseVal;

                    return (
                      <div className="rounded-md border border-zinc-200 bg-white p-2.5 shadow-none text-xs">
                        <p className="font-semibold text-zinc-950 mb-1.5">
                          {item.fullLabel || label}
                        </p>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-zinc-600">Pemasukan:</span>
                            <span className="font-semibold text-emerald-700 tabular-nums">
                              +{formatRupiah(incomeVal)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-zinc-600">Pengeluaran:</span>
                            <span className="font-semibold text-red-700 tabular-nums">
                              -{formatRupiah(expenseVal)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4 pt-1 border-t border-zinc-100">
                            <span className="text-zinc-500">Arus Bersih:</span>
                            <span
                              className={`font-bold tabular-nums ${
                                net >= 0 ? "text-zinc-950" : "text-red-700"
                              }`}
                            >
                              {net >= 0 ? "+" : ""}
                              {formatRupiah(net)}
                            </span>
                          </div>
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
                iconType="square"
                wrapperStyle={{ paddingBottom: 10, fontSize: 11 }}
              />
              <Bar
                name="Pemasukan"
                dataKey="income"
                fill="#09090B"
                radius={[2, 2, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                name="Pengeluaran"
                dataKey="expense"
                fill="#71717A"
                radius={[2, 2, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

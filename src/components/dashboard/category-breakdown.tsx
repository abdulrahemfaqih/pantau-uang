"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatRupiah } from "@/lib/utils";

interface CategoryExpenseItem {
  id: string;
  name: string;
  color: string;
  icon: string;
  total: number;
  percentage: number;
}

interface CategoryBreakdownProps {
  categories: CategoryExpenseItem[];
}

export function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Pengeluaran per Kategori</CardTitle>
          <span className="text-xs text-zinc-500 font-mono">Bulan Berjalan</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-2">
        {categories.length === 0 ? (
          <div className="h-full flex items-center justify-center min-h-[200px] text-zinc-400 text-xs">
            Belum ada pengeluaran di bulan ini.
          </div>
        ) : (
          <div className="space-y-4">
            {categories.slice(0, 6).map((cat) => (
              <div key={cat.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-800">{cat.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 tabular-nums">{cat.percentage}%</span>
                    <span className="font-semibold text-zinc-950 tabular-nums">
                      {formatRupiah(cat.total)}
                    </span>
                  </div>
                </div>
                {/* Thin progress bar */}
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
  );
}

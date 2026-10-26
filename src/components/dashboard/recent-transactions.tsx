"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils";
import { TransactionWithDetails } from "@/hooks/use-transactions";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ArrowUpRight } from "lucide-react";

interface RecentTransactionsProps {
  transactions: TransactionWithDetails[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-zinc-100 flex flex-row items-center justify-between">
        <CardTitle>Transaksi Terbaru</CardTitle>
        <Link
          href="/transactions"
          className="text-xs font-medium text-zinc-600 hover:text-zinc-950 flex items-center gap-1 transition-colors"
        >
          <span>Lihat Semua</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        {transactions.length === 0 ? (
          <div className="p-6 text-center text-zinc-400 text-xs">
            Belum ada transaksi tercatat.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {transactions.map((tx) => {
              const formattedDate = format(new Date(tx.date), "dd MMM yyyy", {
                locale: localeId,
              });

              let badgeVariant: "income" | "expense" | "transfer" = "expense";
              let prefix = "-";
              let amountColor = "text-red-700";

              if (tx.type === "INCOME") {
                badgeVariant = "income";
                prefix = "+";
                amountColor = "text-emerald-700";
              } else if (tx.type === "TRANSFER") {
                badgeVariant = "transfer";
                prefix = "";
                amountColor = "text-blue-700";
              }

              return (
                <div
                  key={tx.id}
                  className="p-3.5 sm:px-5 flex items-center justify-between hover:bg-zinc-50 transition-colors text-xs"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={badgeVariant} className="text-[10px] px-1.5 py-0.5">
                      {tx.type === "INCOME" ? "Masuk" : tx.type === "EXPENSE" ? "Keluar" : "Transfer"}
                    </Badge>
                    <div>
                      <div className="font-medium text-zinc-900">
                        {tx.type === "TRANSFER"
                          ? `${tx.account?.name || "Asal"} → ${tx.toAccount?.name || "Tujuan"}`
                          : tx.category?.name || "Tanpa Kategori"}
                      </div>
                      <div className="text-[11px] text-zinc-500 flex items-center gap-2 mt-0.5">
                        <span className="tabular-nums">{formattedDate}</span>
                        {tx.note && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[120px] sm:max-w-[200px]">{tx.note}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`font-semibold tabular-nums text-sm ${amountColor}`}>
                      {prefix}
                      {formatRupiah(Number(tx.amount))}
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      {tx.account?.name}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

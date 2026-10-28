import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/current-user";
import { db } from "@/db";
import { accounts, transactions } from "@/db/schema";
import { and, eq, gte, lte, desc, ne } from "drizzle-orm";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1), 10);
    const year = parseInt(searchParams.get("year") || String(now.getFullYear()), 10);

    const monthDate = new Date(year, month - 1);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const sixMonthsAgoStart = startOfMonth(subMonths(monthDate, 5));

    // Eksekusi seluruh query secara paralel untuk memangkas latency jaringan
    const [userAccounts, currentMonthTx, trendTx, recentTransactions] = await Promise.all([
      // 1. Ambil seluruh rekening pengguna
      db
        .select()
        .from(accounts)
        .where(eq(accounts.userId, userId))
        .orderBy(desc(accounts.createdAt)),

      // 2. Transaksi bulan ini (mengecualikan 'TRANSFER')
      db.query.transactions.findMany({
        where: and(
          eq(transactions.userId, userId),
          gte(transactions.date, monthStart),
          lte(transactions.date, monthEnd),
          ne(transactions.type, "TRANSFER")
        ),
        with: {
          category: true,
        },
      }),

      // 3. Tren 6 Bulan Terakhir
      db
        .select({
          type: transactions.type,
          amount: transactions.amount,
          date: transactions.date,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            gte(transactions.date, sixMonthsAgoStart),
            lte(transactions.date, monthEnd),
            ne(transactions.type, "TRANSFER")
          )
        ),

      // 4. Transaksi Terbaru (5 item)
      db.query.transactions.findMany({
        where: eq(transactions.userId, userId),
        orderBy: [desc(transactions.date), desc(transactions.createdAt)],
        limit: 5,
        with: {
          account: true,
          toAccount: true,
          category: true,
        },
      }),
    ]);

    // Total saldo gabungan: HANYA rekening yang excludeFromTotal === false
    const includedAccounts = userAccounts.filter((acc) => !acc.excludeFromTotal);
    const hiddenAccountsCount = userAccounts.filter((acc) => acc.excludeFromTotal).length;
    const totalBalance = includedAccounts.reduce((acc, curr) => acc + Number(curr.currentBalance), 0);

    let monthlyIncome = 0;
    let monthlyExpense = 0;
    const categoryExpenseMap = new Map<
      string,
      { id: string; name: string; color: string; icon: string; total: number }
    >();

    for (const tx of currentMonthTx) {
      const amount = Number(tx.amount);
      if (tx.type === "INCOME") {
        monthlyIncome += amount;
      } else if (tx.type === "EXPENSE") {
        monthlyExpense += amount;

        const catId = tx.categoryId || "uncategorized";
        const catName = tx.category?.name || "Tanpa Kategori";
        const catColor = tx.category?.color || "#71717A";
        const catIcon = tx.category?.icon || "Tag";

        const existing = categoryExpenseMap.get(catId) || {
          id: catId,
          name: catName,
          color: catColor,
          icon: catIcon,
          total: 0,
        };
        existing.total += amount;
        categoryExpenseMap.set(catId, existing);
      }
    }

    const netCashflow = monthlyIncome - monthlyExpense;

    // Breakdown Pengeluaran per Kategori dengan persentase
    const categoryExpenses = Array.from(categoryExpenseMap.values())
      .map((cat) => ({
        ...cat,
        percentage: monthlyExpense > 0 ? Math.round((cat.total / monthlyExpense) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // Inisialisasi 6 slot bulan
    const monthlyTrends: Array<{ label: string; income: number; expense: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const targetM = subMonths(monthDate, i);
      const label = format(targetM, "MMM yyyy", { locale: localeId });
      monthlyTrends.push({ label, income: 0, expense: 0 });
    }

    for (const tx of trendTx) {
      const txMonthLabel = format(new Date(tx.date), "MMM yyyy", { locale: localeId });
      const target = monthlyTrends.find((t) => t.label === txMonthLabel);
      if (target) {
        if (tx.type === "INCOME") {
          target.income += Number(tx.amount);
        } else if (tx.type === "EXPENSE") {
          target.expense += Number(tx.amount);
        }
      }
    }

    return NextResponse.json({
      totalBalance,
      hiddenAccountsCount,
      monthlyIncome,
      monthlyExpense,
      netCashflow,
      categoryExpenses,
      monthlyTrends,
      recentTransactions,
      accountsSummary: userAccounts,
    });
  } catch (error) {
    console.error("GET analytics error:", error);
    return NextResponse.json({ message: "Gagal memuat analitik" }, { status: 500 });
  }
}

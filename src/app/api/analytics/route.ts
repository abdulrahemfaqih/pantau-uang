import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/current-user";
import { db } from "@/db";
import { accounts, transactions } from "@/db/schema";
import { and, eq, gte, lte, desc, ne } from "drizzle-orm";
import { startOfMonth, endOfMonth, getDaysInMonth, format } from "date-fns";
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

    // Eksekusi seluruh query secara paralel untuk memangkas latency jaringan
    const [userAccounts, currentMonthTx, recentTransactions] = await Promise.all([
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

      // 3. Transaksi Terbaru (5 item)
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

    // Inisialisasi slot mingguan bulan berjalan (Minggu 1 s/d 4 atau 5)
    const totalDays = getDaysInMonth(monthDate);
    const fullMonthName = format(monthDate, "MMMM", { locale: localeId });

    const weeklyTrends: Array<{
      week: number;
      label: string;
      fullLabel: string;
      income: number;
      expense: number;
    }> = [
      { week: 1, label: "M1 (1-7)", fullLabel: `Minggu 1 (1 - 7 ${fullMonthName})`, income: 0, expense: 0 },
      { week: 2, label: "M2 (8-14)", fullLabel: `Minggu 2 (8 - 14 ${fullMonthName})`, income: 0, expense: 0 },
      { week: 3, label: "M3 (15-21)", fullLabel: `Minggu 3 (15 - 21 ${fullMonthName})`, income: 0, expense: 0 },
      { week: 4, label: "M4 (22-28)", fullLabel: `Minggu 4 (22 - 28 ${fullMonthName})`, income: 0, expense: 0 },
    ];

    if (totalDays > 28) {
      weeklyTrends.push({
        week: 5,
        label: `M5 (29-${totalDays})`,
        fullLabel: `Minggu 5 (29 - ${totalDays} ${fullMonthName})`,
        income: 0,
        expense: 0,
      });
    }

    for (const tx of currentMonthTx) {
      const amount = Number(tx.amount);
      const day = new Date(tx.date).getDate();

      let weekIdx = 0;
      if (day <= 7) weekIdx = 0;
      else if (day <= 14) weekIdx = 1;
      else if (day <= 21) weekIdx = 2;
      else if (day <= 28) weekIdx = 3;
      else weekIdx = 4;

      if (weekIdx < weeklyTrends.length) {
        if (tx.type === "INCOME") {
          weeklyTrends[weekIdx].income += amount;
        } else if (tx.type === "EXPENSE") {
          weeklyTrends[weekIdx].expense += amount;
        }
      }

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

    return NextResponse.json({
      totalBalance,
      hiddenAccountsCount,
      monthlyIncome,
      monthlyExpense,
      netCashflow,
      categoryExpenses,
      weeklyTrends,
      monthlyTrends: weeklyTrends,
      recentTransactions,
      accountsSummary: userAccounts,
    });
  } catch (error) {
    console.error("GET analytics error:", error);
    return NextResponse.json({ message: "Gagal memuat analitik" }, { status: 500 });
  }
}

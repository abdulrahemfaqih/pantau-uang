import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/current-user";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { and, eq, gte, lte, ne } from "drizzle-orm";
import {
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  getDaysInMonth,
  format,
} from "date-fns";
import { id as localeId } from "date-fns/locale";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const viewType = searchParams.get("type") || "daily"; // 'daily' | 'monthly' | 'yearly'
    const now = new Date();
    const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1), 10);
    const year = parseInt(searchParams.get("year") || String(now.getFullYear()), 10);

    // 1. STATISTIK HARIAN (Daily: 1 s/d 28/30/31 pada bulan terpilih)
    if (viewType === "daily") {
      const monthDate = new Date(year, month - 1, 1);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      const totalDays = getDaysInMonth(monthDate);

      const txList = await db.query.transactions.findMany({
        where: and(
          eq(transactions.userId, userId),
          gte(transactions.date, start),
          lte(transactions.date, end),
          ne(transactions.type, "TRANSFER")
        ),
        with: {
          category: true,
        },
      });

      // Inisialisasi slot untuk setiap hari (1 .. totalDays)
      const dailyMap = new Map<
        number,
        {
          day: number;
          label: string;
          fullDate: string;
          expense: number;
          income: number;
          txCount: number;
        }
      >();

      for (let day = 1; day <= totalDays; day++) {
        const currentDate = new Date(year, month - 1, day);
        dailyMap.set(day, {
          day,
          label: `Tgl ${day}`,
          fullDate: format(currentDate, "dd MMMM yyyy", { locale: localeId }),
          expense: 0,
          income: 0,
          txCount: 0,
        });
      }

      let totalExpense = 0;
      let totalIncome = 0;
      const categoryMap = new Map<string, { name: string; color: string; total: number }>();

      for (const tx of txList) {
        const txDate = new Date(tx.date);
        const dayNumber = txDate.getDate();
        const amount = Number(tx.amount);
        const daySlot = dailyMap.get(dayNumber);

        if (daySlot) {
          daySlot.txCount += 1;
          if (tx.type === "EXPENSE") {
            daySlot.expense += amount;
            totalExpense += amount;

            const catName = tx.category?.name || "Tanpa Kategori";
            const catColor = tx.category?.color || "#71717A";
            const currentCat = categoryMap.get(catName) || { name: catName, color: catColor, total: 0 };
            currentCat.total += amount;
            categoryMap.set(catName, currentCat);
          } else if (tx.type === "INCOME") {
            daySlot.income += amount;
            totalIncome += amount;
          }
        }
      }

      const dailyData = Array.from(dailyMap.values());
      const activeDaysCount = dailyData.filter((d) => d.expense > 0).length;
      const averageExpense = totalDays > 0 ? Math.round(totalExpense / totalDays) : 0;

      // Cari hari dengan pengeluaran terbesar
      let peakDay: { day: number; label: string; fullDate: string; amount: number } | null = null;
      let highestAmount = 0;
      for (const d of dailyData) {
        if (d.expense > highestAmount) {
          highestAmount = d.expense;
          peakDay = {
            day: d.day,
            label: d.label,
            fullDate: d.fullDate,
            amount: d.expense,
          };
        }
      }

      // Top 5 hari terboros
      const topExpenseDays = [...dailyData]
        .filter((d) => d.expense > 0)
        .sort((a, b) => b.expense - a.expense)
        .slice(0, 5);

      // Kategori breakdown
      const categoryBreakdown = Array.from(categoryMap.values())
        .map((cat) => ({
          ...cat,
          percentage: totalExpense > 0 ? Math.round((cat.total / totalExpense) * 100) : 0,
        }))
        .sort((a, b) => b.total - a.total);

      return NextResponse.json({
        viewType: "daily",
        month,
        year,
        monthName: format(monthDate, "MMMM yyyy", { locale: localeId }),
        totalDays,
        totalExpense,
        totalIncome,
        netCashflow: totalIncome - totalExpense,
        averageExpense,
        activeDaysCount,
        peakDay,
        dailyData,
        topExpenseDays,
        categoryBreakdown,
      });
    }

    // 2. STATISTIK BULANAN (Monthly: Januari s/d Desember pada tahun terpilih)
    if (viewType === "monthly") {
      const yearDate = new Date(year, 0, 1);
      const start = startOfYear(yearDate);
      const end = endOfYear(yearDate);

      const txList = await db.query.transactions.findMany({
        where: and(
          eq(transactions.userId, userId),
          gte(transactions.date, start),
          lte(transactions.date, end),
          ne(transactions.type, "TRANSFER")
        ),
      });

      // 12 Bulan (Jan - Des)
      const monthlyData: Array<{
        month: number;
        label: string;
        fullLabel: string;
        expense: number;
        income: number;
        txCount: number;
      }> = [];

      for (let m = 0; m < 12; m++) {
        const mDate = new Date(year, m, 1);
        monthlyData.push({
          month: m + 1,
          label: format(mDate, "MMM", { locale: localeId }),
          fullLabel: format(mDate, "MMMM yyyy", { locale: localeId }),
          expense: 0,
          income: 0,
          txCount: 0,
        });
      }

      let totalExpense = 0;
      let totalIncome = 0;

      for (const tx of txList) {
        const txDate = new Date(tx.date);
        const monthIndex = txDate.getMonth();
        const amount = Number(tx.amount);

        if (monthIndex >= 0 && monthIndex < 12) {
          monthlyData[monthIndex].txCount += 1;
          if (tx.type === "EXPENSE") {
            monthlyData[monthIndex].expense += amount;
            totalExpense += amount;
          } else if (tx.type === "INCOME") {
            monthlyData[monthIndex].income += amount;
            totalIncome += amount;
          }
        }
      }

      // Cari bulan dengan pengeluaran terbesar
      let peakMonth: { month: number; label: string; fullLabel: string; amount: number } | null = null;
      let highestAmount = 0;
      for (const m of monthlyData) {
        if (m.expense > highestAmount) {
          highestAmount = m.expense;
          peakMonth = {
            month: m.month,
            label: m.label,
            fullLabel: m.fullLabel,
            amount: m.expense,
          };
        }
      }

      const activeMonthsCount = monthlyData.filter((m) => m.expense > 0 || m.income > 0).length;
      const averageExpense =
        activeMonthsCount > 0 ? Math.round(totalExpense / activeMonthsCount) : 0;

      return NextResponse.json({
        viewType: "monthly",
        year,
        totalExpense,
        totalIncome,
        netCashflow: totalIncome - totalExpense,
        averageExpense,
        activeMonthsCount,
        peakMonth,
        monthlyData,
      });
    }

    // 3. STATISTIK TAHUNAN (Yearly: Seluruh tahun transaksi)
    if (viewType === "yearly") {
      const txList = await db.query.transactions.findMany({
        where: and(eq(transactions.userId, userId), ne(transactions.type, "TRANSFER")),
      });

      const yearMap = new Map<
        number,
        {
          year: number;
          label: string;
          expense: number;
          income: number;
          txCount: number;
        }
      >();

      let totalExpense = 0;
      let totalIncome = 0;

      // Jika belum ada data sama sekali, sertakan tahun saat ini sebagai baseline
      yearMap.set(now.getFullYear(), {
        year: now.getFullYear(),
        label: String(now.getFullYear()),
        expense: 0,
        income: 0,
        txCount: 0,
      });

      for (const tx of txList) {
        const txYear = new Date(tx.date).getFullYear();
        const amount = Number(tx.amount);
        const slot = yearMap.get(txYear) || {
          year: txYear,
          label: String(txYear),
          expense: 0,
          income: 0,
          txCount: 0,
        };

        slot.txCount += 1;
        if (tx.type === "EXPENSE") {
          slot.expense += amount;
          totalExpense += amount;
        } else if (tx.type === "INCOME") {
          slot.income += amount;
          totalIncome += amount;
        }
        yearMap.set(txYear, slot);
      }

      const yearlyData = Array.from(yearMap.values()).sort((a, b) => a.year - b.year);

      let peakYear: { year: number; amount: number } | null = null;
      let highestAmount = 0;
      for (const y of yearlyData) {
        if (y.expense > highestAmount) {
          highestAmount = y.expense;
          peakYear = { year: y.year, amount: y.expense };
        }
      }

      const averageExpense =
        yearlyData.length > 0 ? Math.round(totalExpense / yearlyData.length) : 0;

      return NextResponse.json({
        viewType: "yearly",
        totalExpense,
        totalIncome,
        netCashflow: totalIncome - totalExpense,
        averageExpense,
        peakYear,
        yearlyData,
      });
    }

    return NextResponse.json({ message: "Tipe statistik tidak valid" }, { status: 400 });
  } catch (error) {
    console.error("GET /api/statistics error:", error);
    return NextResponse.json({ message: "Gagal memuat statistik" }, { status: 500 });
  }
}


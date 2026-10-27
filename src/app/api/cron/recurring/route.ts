import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { accounts, recurringTransactions, transactions } from "@/db/schema";
import { and, eq, lte, sql } from "drizzle-orm";
import { addDays, addWeeks, addMonths, addYears } from "date-fns";

export async function GET(req: NextRequest) {
  // Verifikasi otorisasi Vercel Cron Secret (jika disetel di environment)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ message: "Tidak memiliki otorisasi" }, { status: 401 });
    }
  }

  try {
    const now = new Date();

    // Ambil seluruh jadwal transaksi berulang yang aktif dan sudah jatuh tempo (nextRunDate <= now)
    const dueList = await db
      .select()
      .from(recurringTransactions)
      .where(
        and(
          eq(recurringTransactions.isActive, true),
          lte(recurringTransactions.nextRunDate, now)
        )
      );

    let processedCount = 0;

    for (const item of dueList) {
      await db.transaction(async (tx) => {
        // 1. Eksekusi sesuai tipe transaksi
        if (item.type === "INCOME") {
          await tx.insert(transactions).values({
            userId: item.userId,
            type: "INCOME",
            amount: item.amount,
            date: item.nextRunDate,
            note: item.note ? `[Otomatis] ${item.note}` : "[Otomatis] Transaksi Rutin",
            accountId: item.accountId,
            categoryId: item.categoryId,
          });

          await tx
            .update(accounts)
            .set({
              currentBalance: sql`${accounts.currentBalance} + ${item.amount}`,
            })
            .where(eq(accounts.id, item.accountId));
        } else if (item.type === "EXPENSE") {
          await tx.insert(transactions).values({
            userId: item.userId,
            type: "EXPENSE",
            amount: item.amount,
            date: item.nextRunDate,
            note: item.note ? `[Otomatis] ${item.note}` : "[Otomatis] Transaksi Rutin",
            accountId: item.accountId,
            categoryId: item.categoryId,
          });

          await tx
            .update(accounts)
            .set({
              currentBalance: sql`${accounts.currentBalance} - ${item.amount}`,
            })
            .where(eq(accounts.id, item.accountId));
        } else if (item.type === "TRANSFER" && item.toAccountId) {
          await tx.insert(transactions).values({
            userId: item.userId,
            type: "TRANSFER",
            amount: item.amount,
            date: item.nextRunDate,
            note: item.note ? `[Otomatis] ${item.note}` : "[Otomatis] Transfer Rutin",
            accountId: item.accountId,
            toAccountId: item.toAccountId,
          });

          await tx
            .update(accounts)
            .set({
              currentBalance: sql`${accounts.currentBalance} - ${item.amount}`,
            })
            .where(eq(accounts.id, item.accountId));

          await tx
            .update(accounts)
            .set({
              currentBalance: sql`${accounts.currentBalance} + ${item.amount}`,
            })
            .where(eq(accounts.id, item.toAccountId));
        }

        // 2. Hitung tanggal jadwal berikutnya (nextRunDate)
        let nextDate = new Date(item.nextRunDate);
        if (item.frequency === "DAILY") {
          nextDate = addDays(nextDate, 1);
        } else if (item.frequency === "WEEKLY") {
          nextDate = addWeeks(nextDate, 1);
        } else if (item.frequency === "MONTHLY") {
          nextDate = addMonths(nextDate, 1);
        } else if (item.frequency === "YEARLY") {
          nextDate = addYears(nextDate, 1);
        }

        // 3. Perbarui lastRunDate dan nextRunDate
        await tx
          .update(recurringTransactions)
          .set({
            lastRunDate: now,
            nextRunDate: nextDate,
          })
          .where(eq(recurringTransactions.id, item.id));

        processedCount++;
      });
    }

    return NextResponse.json({
      success: true,
      processedCount,
      message: `${processedCount} transaksi berulang berhasil diproses.`,
    });
  } catch (error: unknown) {
    console.error("Vercel Cron recurring error:", error);
    const message = error instanceof Error ? error.message : "Terjadi kesalahan saat memproses cron transaksi berulang";
    return NextResponse.json({ message }, { status: 500 });
  }
}

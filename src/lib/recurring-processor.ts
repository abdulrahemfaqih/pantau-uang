import { db } from "@/db";
import { accounts, recurringTransactions, transactions } from "@/db/schema";
import { and, eq, lte, sql } from "drizzle-orm";
import { addDays, addWeeks, addMonths, addYears } from "date-fns";

export async function processDueRecurringTransactions(userId?: string) {
  // Waktu efektif dengan penyesuaian zona waktu WIB (UTC+7)
  // Agar jatuh tempo jam 00:00 WIB (17:00 UTC) langsung dieksekusi tepat pada pergantian hari kalender
  const effectiveNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const now = new Date();

  const conditions = [
    eq(recurringTransactions.isActive, true),
    lte(recurringTransactions.nextRunDate, effectiveNow),
  ];

  if (userId) {
    conditions.push(eq(recurringTransactions.userId, userId));
  }

  // Ambil seluruh jadwal transaksi berulang yang aktif dan sudah jatuh tempo
  const dueList = await db
    .select()
    .from(recurringTransactions)
    .where(and(...conditions));

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

  return { processedCount, dueCount: dueList.length };
}


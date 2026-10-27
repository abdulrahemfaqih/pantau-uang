import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/current-user";
import { db } from "@/db";
import { accounts, debtPayments, debts, transactions } from "@/db/schema";
import { debtPaymentFormSchema } from "@/lib/validations";
import { and, eq, sql } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const validated = debtPaymentFormSchema.parse(body);

    const result = await db.transaction(async (tx) => {
      // 1. Ambil data hutang / piutang terkait
      const [targetDebt] = await tx
        .select()
        .from(debts)
        .where(and(eq(debts.id, id), eq(debts.userId, userId)))
        .limit(1);

      if (!targetDebt) {
        throw new Error("Catatan hutang/piutang tidak ditemukan");
      }

      if (targetDebt.remainingAmount <= 0) {
        throw new Error("Hutang/piutang ini sudah lunas sepenuhnya");
      }

      if (validated.amount > targetDebt.remainingAmount) {
        throw new Error("Nominal pembayaran tidak boleh melebihi sisa tagihan");
      }

      // 2. Simpan record pembayaran
      const [createdPayment] = await tx
        .insert(debtPayments)
        .values({
          debtId: targetDebt.id,
          userId,
          amount: validated.amount,
          accountId: validated.accountId || null,
          date: validated.date,
          note: validated.note || null,
        })
        .returning();

      // 3. Update status dan sisa tagihan di tabel debts
      const newRemaining = targetDebt.remainingAmount - validated.amount;
      const newStatus = newRemaining <= 0 ? "PAID" : "PARTIAL";

      await tx
        .update(debts)
        .set({
          remainingAmount: newRemaining,
          status: newStatus,
        })
        .where(eq(debts.id, targetDebt.id));

      // 4. Jika pengguna memilih rekening, sesuaikan saldo dan catat riwayat arus kas
      if (validated.accountId) {
        const [targetAccount] = await tx
          .select()
          .from(accounts)
          .where(and(eq(accounts.id, validated.accountId), eq(accounts.userId, userId)))
          .limit(1);

        if (!targetAccount) {
          throw new Error("Rekening yang dipilih tidak ditemukan");
        }

        if (targetDebt.type === "DEBT") {
          // Hutang saya: kita membayar uang ke orang lain (EXPENSE)
          await tx
            .update(accounts)
            .set({
              currentBalance: sql`${accounts.currentBalance} - ${validated.amount}`,
            })
            .where(eq(accounts.id, validated.accountId));

          await tx.insert(transactions).values({
            userId,
            type: "EXPENSE",
            amount: validated.amount,
            date: validated.date,
            note: validated.note
              ? `Pembayaran hutang ke ${targetDebt.personName} (${validated.note})`
              : `Pembayaran hutang ke ${targetDebt.personName}`,
            accountId: validated.accountId,
            categoryId: null,
          });
        } else if (targetDebt.type === "LOAN") {
          // Piutang saya: orang lain membayar uang ke kita (INCOME)
          await tx
            .update(accounts)
            .set({
              currentBalance: sql`${accounts.currentBalance} + ${validated.amount}`,
            })
            .where(eq(accounts.id, validated.accountId));

          await tx.insert(transactions).values({
            userId,
            type: "INCOME",
            amount: validated.amount,
            date: validated.date,
            note: validated.note
              ? `Pelunasan piutang dari ${targetDebt.personName} (${validated.note})`
              : `Pelunasan piutang dari ${targetDebt.personName}`,
            accountId: validated.accountId,
            categoryId: null,
          });
        }
      }

      return createdPayment;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error("POST debt payment error:", error);
    const message = error instanceof Error ? error.message : "Gagal mencatat pembayaran hutang/piutang";
    return NextResponse.json({ message }, { status: 400 });
  }
}

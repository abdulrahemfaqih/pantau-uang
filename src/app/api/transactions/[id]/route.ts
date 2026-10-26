import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/current-user";
import { db } from "@/db";
import { accounts, transactions } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await db.transaction(async (tx) => {
      // Find the transaction
      const [targetTx] = await tx
        .select()
        .from(transactions)
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
        .limit(1);

      if (!targetTx) {
        throw new Error("Transaksi tidak ditemukan");
      }

      // Case 1: INCOME
      if (targetTx.type === "INCOME") {
        // Reverse income: deduct balance
        await tx
          .update(accounts)
          .set({
            currentBalance: sql`${accounts.currentBalance} - ${targetTx.amount}`,
          })
          .where(eq(accounts.id, targetTx.accountId));

        await tx.delete(transactions).where(eq(transactions.id, targetTx.id));
        return;
      }

      // Case 2: EXPENSE
      if (targetTx.type === "EXPENSE") {
        // Reverse expense: add back balance
        await tx
          .update(accounts)
          .set({
            currentBalance: sql`${accounts.currentBalance} + ${targetTx.amount}`,
          })
          .where(eq(accounts.id, targetTx.accountId));

        await tx.delete(transactions).where(eq(transactions.id, targetTx.id));
        return;
      }

      // Case 3: TRANSFER
      if (targetTx.type === "TRANSFER") {
        if (!targetTx.toAccountId) {
          throw new Error("Transaksi transfer tidak memiliki rekening tujuan");
        }

        // Return transfer amount to source account (A)
        await tx
          .update(accounts)
          .set({
            currentBalance: sql`${accounts.currentBalance} + ${targetTx.amount}`,
          })
          .where(eq(accounts.id, targetTx.accountId));

        // Deduct transfer amount from target account (B)
        await tx
          .update(accounts)
          .set({
            currentBalance: sql`${accounts.currentBalance} - ${targetTx.amount}`,
          })
          .where(eq(accounts.id, targetTx.toAccountId));

        // Check if there is an admin fee expense linked to this transfer
        const [adminFeeTx] = await tx
          .select()
          .from(transactions)
          .where(
            and(
              eq(transactions.parentTransferId, targetTx.id),
              eq(transactions.userId, userId)
            )
          )
          .limit(1);

        if (adminFeeTx) {
          // Return admin fee amount to source account (A)
          await tx
            .update(accounts)
            .set({
              currentBalance: sql`${accounts.currentBalance} + ${adminFeeTx.amount}`,
            })
            .where(eq(accounts.id, adminFeeTx.accountId));

          // Delete admin fee expense record
          await tx.delete(transactions).where(eq(transactions.id, adminFeeTx.id));
        }

        // Delete parent transfer record
        await tx.delete(transactions).where(eq(transactions.id, targetTx.id));
        return;
      }
    });

    return NextResponse.json({ message: "Transaksi berhasil dihapus" });
  } catch (error: unknown) {
    console.error("DELETE transaction error:", error);
    const message = error instanceof Error ? error.message : "Gagal menghapus transaksi";
    return NextResponse.json({ message }, { status: 400 });
  }
}

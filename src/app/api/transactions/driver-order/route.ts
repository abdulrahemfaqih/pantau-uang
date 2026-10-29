import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/current-user";
import { db } from "@/db";
import { accounts, categories, transactions } from "@/db/schema";
import { driverOrderApiSchema } from "@/lib/validations";
import { and, eq, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = driverOrderApiSchema.parse(body);

    const result = await db.transaction(async (tx) => {
      // 1. Verifikasi rekening dompet aplikasi
      const [appAccount] = await tx
        .select()
        .from(accounts)
        .where(and(eq(accounts.id, validated.appAccountId), eq(accounts.userId, userId)))
        .limit(1);

      if (!appAccount) {
        throw new Error("Rekening dompet aplikasi tidak ditemukan");
      }

      // 2. Verifikasi kategori pendapatan driver (harus bertipe INCOME)
      const [incomeCategory] = await tx
        .select()
        .from(categories)
        .where(and(eq(categories.id, validated.incomeCategoryId), eq(categories.userId, userId)))
        .limit(1);

      if (!incomeCategory) {
        throw new Error("Kategori pendapatan driver tidak ditemukan");
      }

      if (incomeCategory.type !== "INCOME") {
        throw new Error("Kategori pendapatan harus bertipe INCOME");
      }

      // 3. Verifikasi rekening tunai fisik jika ada tagihan COD
      let cashAccount = null;
      if (validated.codAmount > 0) {
        if (!validated.cashAccountId) {
          throw new Error("Rekening tunai fisik wajib dipilih jika tagihan COD lebih dari 0");
        }

        const [foundCashAccount] = await tx
          .select()
          .from(accounts)
          .where(and(eq(accounts.id, validated.cashAccountId), eq(accounts.userId, userId)))
          .limit(1);

        if (!foundCashAccount) {
          throw new Error("Rekening tunai fisik tidak ditemukan");
        }
        cashAccount = foundCashAccount;
      }

      // 4. Catat transaksi PEMASUKAN (Pendapatan Driver)
      const [incomeTx] = await tx
        .insert(transactions)
        .values({
          userId,
          type: "INCOME",
          amount: validated.driverIncome,
          date: validated.date,
          note: validated.orderNumber,
          accountId: validated.appAccountId,
          categoryId: validated.incomeCategoryId,
        })
        .returning();

      // Tambahkan saldo rekening dompet aplikasi sebesar pendapatan driver
      await tx
        .update(accounts)
        .set({
          currentBalance: sql`${accounts.currentBalance} + ${validated.driverIncome}`,
        })
        .where(eq(accounts.id, validated.appAccountId));

      // 5. Catat transaksi TRANSFER jika terdapat tagihan COD (dompet aplikasi -> tunai fisik)
      let transferTx = null;
      if (validated.codAmount > 0 && validated.cashAccountId) {
        const [createdTransfer] = await tx
          .insert(transactions)
          .values({
            userId,
            type: "TRANSFER",
            amount: validated.codAmount,
            date: validated.date,
            note: `Setoran Tunai COD - ${validated.orderNumber}`,
            accountId: validated.appAccountId,
            toAccountId: validated.cashAccountId,
          })
          .returning();

        transferTx = createdTransfer;

        // Potong saldo dompet aplikasi sebesar tagihan COD
        await tx
          .update(accounts)
          .set({
            currentBalance: sql`${accounts.currentBalance} - ${validated.codAmount}`,
          })
          .where(eq(accounts.id, validated.appAccountId));

        // Tambah saldo dompet tunai fisik sebesar tagihan COD yang diterima dari pelanggan
        await tx
          .update(accounts)
          .set({
            currentBalance: sql`${accounts.currentBalance} + ${validated.codAmount}`,
          })
          .where(eq(accounts.id, validated.cashAccountId));
      }

      return {
        incomeTransaction: incomeTx,
        transferTransaction: transferTx,
        summary: {
          orderNumber: validated.orderNumber,
          driverIncome: validated.driverIncome,
          codAmount: validated.codAmount,
          appAccountName: appAccount.name,
          cashAccountName: cashAccount ? cashAccount.name : null,
        },
      };
    });

    return NextResponse.json(
      {
        message: "Order driver berhasil dicatat",
        data: result,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST driver-order error:", error);
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json({ message: "Data tidak valid", errors: error }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Gagal memproses order driver";
    return NextResponse.json({ message }, { status: 400 });
  }
}

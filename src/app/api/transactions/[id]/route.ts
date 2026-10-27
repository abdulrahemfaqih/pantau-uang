import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/current-user";
import { db } from "@/db";
import { accounts, categories, transactions } from "@/db/schema";
import { transactionFormSchema } from "@/lib/validations";
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

export async function PUT(
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
    const validated = transactionFormSchema.parse(body);

    if (validated.type !== "TRANSFER" && validated.categoryId) {
      const cat = await db.query.categories.findFirst({
        where: eq(categories.id, validated.categoryId),
      });
      if (cat && cat.type !== validated.type) {
        return NextResponse.json(
          { message: "Tipe kategori tidak sesuai dengan tipe transaksi" },
          { status: 400 }
        );
      }
    }

    const result = await db.transaction(async (tx) => {
      // 1. Ambil transaksi yang akan diedit
      const [existingTx] = await tx
        .select()
        .from(transactions)
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
        .limit(1);

      if (!existingTx) {
        throw new Error("Transaksi tidak ditemukan");
      }

      if (existingTx.parentTransferId) {
        throw new Error("Biaya admin tidak dapat diubah langsung. Silakan ubah transaksi transfer induknya.");
      }

      // 2. Rollback efek transaksi lama terhadap saldo rekening
      if (existingTx.type === "INCOME") {
        await tx
          .update(accounts)
          .set({
            currentBalance: sql`${accounts.currentBalance} - ${existingTx.amount}`,
          })
          .where(eq(accounts.id, existingTx.accountId));
      } else if (existingTx.type === "EXPENSE") {
        await tx
          .update(accounts)
          .set({
            currentBalance: sql`${accounts.currentBalance} + ${existingTx.amount}`,
          })
          .where(eq(accounts.id, existingTx.accountId));
      } else if (existingTx.type === "TRANSFER") {
        if (existingTx.toAccountId) {
          // Kembalikan ke rekening asal
          await tx
            .update(accounts)
            .set({
              currentBalance: sql`${accounts.currentBalance} + ${existingTx.amount}`,
            })
            .where(eq(accounts.id, existingTx.accountId));

          // Kurangi dari rekening tujuan
          await tx
            .update(accounts)
            .set({
              currentBalance: sql`${accounts.currentBalance} - ${existingTx.amount}`,
            })
            .where(eq(accounts.id, existingTx.toAccountId));
        }

        // Cek dan rollback biaya admin lama jika ada
        const [oldAdminFeeTx] = await tx
          .select()
          .from(transactions)
          .where(
            and(
              eq(transactions.parentTransferId, existingTx.id),
              eq(transactions.userId, userId)
            )
          )
          .limit(1);

        if (oldAdminFeeTx) {
          await tx
            .update(accounts)
            .set({
              currentBalance: sql`${accounts.currentBalance} + ${oldAdminFeeTx.amount}`,
            })
            .where(eq(accounts.id, oldAdminFeeTx.accountId));

          await tx.delete(transactions).where(eq(transactions.id, oldAdminFeeTx.id));
        }
      }

      // 3. Terapkan data baru
      // Case 1: EXPENSE
      if (validated.type === "EXPENSE") {
        const [sourceAccount] = await tx
          .select()
          .from(accounts)
          .where(and(eq(accounts.id, validated.accountId), eq(accounts.userId, userId)))
          .limit(1);

        if (!sourceAccount) {
          throw new Error("Rekening tidak ditemukan");
        }

        const [updatedTx] = await tx
          .update(transactions)
          .set({
            type: "EXPENSE",
            amount: validated.amount,
            date: validated.date,
            note: validated.note || null,
            accountId: validated.accountId,
            toAccountId: null,
            categoryId: validated.categoryId || null,
          })
          .where(eq(transactions.id, existingTx.id))
          .returning();

        await tx
          .update(accounts)
          .set({
            currentBalance: sql`${accounts.currentBalance} - ${validated.amount}`,
          })
          .where(eq(accounts.id, validated.accountId));

        return updatedTx;
      }

      // Case 2: INCOME
      if (validated.type === "INCOME") {
        const [targetAccount] = await tx
          .select()
          .from(accounts)
          .where(and(eq(accounts.id, validated.accountId), eq(accounts.userId, userId)))
          .limit(1);

        if (!targetAccount) {
          throw new Error("Rekening tidak ditemukan");
        }

        const [updatedTx] = await tx
          .update(transactions)
          .set({
            type: "INCOME",
            amount: validated.amount,
            date: validated.date,
            note: validated.note || null,
            accountId: validated.accountId,
            toAccountId: null,
            categoryId: validated.categoryId || null,
          })
          .where(eq(transactions.id, existingTx.id))
          .returning();

        await tx
          .update(accounts)
          .set({
            currentBalance: sql`${accounts.currentBalance} + ${validated.amount}`,
          })
          .where(eq(accounts.id, validated.accountId));

        return updatedTx;
      }

      // Case 3: TRANSFER
      if (validated.type === "TRANSFER") {
        if (!validated.toAccountId) {
          throw new Error("Rekening tujuan wajib dipilih");
        }

        const [fromAcc] = await tx
          .select()
          .from(accounts)
          .where(and(eq(accounts.id, validated.accountId), eq(accounts.userId, userId)))
          .limit(1);

        const [toAcc] = await tx
          .select()
          .from(accounts)
          .where(and(eq(accounts.id, validated.toAccountId), eq(accounts.userId, userId)))
          .limit(1);

        if (!fromAcc || !toAcc) {
          throw new Error("Rekening asal atau tujuan tidak ditemukan");
        }

        const adminFee = validated.adminFee || 0;

        const [updatedTx] = await tx
          .update(transactions)
          .set({
            type: "TRANSFER",
            amount: validated.amount,
            date: validated.date,
            note: validated.note || null,
            accountId: validated.accountId,
            toAccountId: validated.toAccountId,
            categoryId: null,
          })
          .where(eq(transactions.id, existingTx.id))
          .returning();

        if (adminFee > 0) {
          let [adminCategory] = await tx
            .select()
            .from(categories)
            .where(and(eq(categories.userId, userId), eq(categories.name, "Biaya Admin")))
            .limit(1);

          if (!adminCategory) {
            const [createdAdminCategory] = await tx
              .insert(categories)
              .values({
                userId,
                name: "Biaya Admin",
                type: "EXPENSE",
                color: "#71717A",
                icon: "Landmark",
                isSystem: true,
              })
              .returning();
            adminCategory = createdAdminCategory;
          }

          await tx.insert(transactions).values({
            userId,
            type: "EXPENSE",
            amount: adminFee,
            date: validated.date,
            note: `Biaya admin transfer ke ${toAcc.name}`,
            accountId: validated.accountId,
            categoryId: adminCategory.id,
            parentTransferId: updatedTx.id,
          });
        }

        const totalDeduction = validated.amount + adminFee;
        await tx
          .update(accounts)
          .set({
            currentBalance: sql`${accounts.currentBalance} - ${totalDeduction}`,
          })
          .where(eq(accounts.id, validated.accountId));

        await tx
          .update(accounts)
          .set({
            currentBalance: sql`${accounts.currentBalance} + ${validated.amount}`,
          })
          .where(eq(accounts.id, validated.toAccountId));

        return updatedTx;
      }
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("PUT transaction error:", error);
    const message = error instanceof Error ? error.message : "Gagal memperbarui transaksi";
    return NextResponse.json({ message }, { status: 400 });
  }
}


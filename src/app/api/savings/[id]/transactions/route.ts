import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/current-user";
import { db } from "@/db";
import { accounts, categories, savingsGoals, savingsMembers, savingsTransactions, transactions } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

const transactionBodySchema = z.object({
  type: z.enum(["DEPOSIT", "WITHDRAW", "YIELD"]),
  amount: z.coerce.number().int().positive("Nominal harus lebih dari 0"),
  accountId: z.string().uuid("Rekening tidak valid").optional().nullable(),
  note: z.string().max(255).optional().nullable(),
  date: z.coerce.date().default(() => new Date()),
});

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
    const validated = transactionBodySchema.parse(body);

    const result = await db.transaction(async (tx) => {
      // 1. Validasi membership
      const [membership] = await tx
        .select()
        .from(savingsMembers)
        .where(and(eq(savingsMembers.savingsGoalId, id), eq(savingsMembers.userId, userId)))
        .limit(1);

      if (!membership) {
        throw new Error("Anda bukan anggota dari tabungan ini");
      }

      // 2. Ambil data goal
      const [goal] = await tx
        .select()
        .from(savingsGoals)
        .where(eq(savingsGoals.id, id))
        .limit(1);

      if (!goal) {
        throw new Error("Tabungan tidak ditemukan");
      }

      if (goal.status !== "ACTIVE") {
        throw new Error("Tabungan ini sudah tidak aktif");
      }

      // 3. Jika penarikan (WITHDRAW), validasi bahwa user tidak menarik lebih dari kontribusinya
      if (validated.type === "WITHDRAW") {
        const userTxs = await tx
          .select({
            type: savingsTransactions.type,
            amount: savingsTransactions.amount,
          })
          .from(savingsTransactions)
          .where(and(eq(savingsTransactions.savingsGoalId, id), eq(savingsTransactions.userId, userId)));

        let userNetContribution = 0;
        for (const t of userTxs) {
          if (t.type === "DEPOSIT") userNetContribution += Number(t.amount);
          else if (t.type === "WITHDRAW") userNetContribution -= Number(t.amount);
        }

        if (validated.amount > userNetContribution) {
          throw new Error(`Nominal penarikan melebihi total kontribusi tabungan Anda (Rp ${userNetContribution.toLocaleString("id-ID")})`);
        }
      }

      // 4. Jika rekening dipilih, sesuaikan saldo rekening
      if (validated.accountId) {
        const [targetAccount] = await tx
          .select()
          .from(accounts)
          .where(and(eq(accounts.id, validated.accountId), eq(accounts.userId, userId)))
          .limit(1);

        if (!targetAccount) {
          throw new Error("Rekening yang dipilih tidak ditemukan");
        }

        if (validated.type === "DEPOSIT") {
          // Setor: saldo rekening terpotong
          if (Number(targetAccount.currentBalance) < validated.amount) {
            throw new Error("Saldo rekening tidak mencukupi untuk melakukan setoran ini");
          }

          await tx
            .update(accounts)
            .set({
              currentBalance: sql`${accounts.currentBalance} - ${validated.amount}`,
            })
            .where(eq(accounts.id, validated.accountId));

          let [savingsCat] = await tx
            .select()
            .from(categories)
            .where(and(eq(categories.userId, userId), eq(categories.name, "Tabungan")))
            .limit(1);

          if (!savingsCat) {
            const [createdCat] = await tx
              .insert(categories)
              .values({
                userId,
                name: "Tabungan",
                type: "EXPENSE",
                color: "#09090B",
                icon: "PiggyBank",
                isSystem: true,
              })
              .returning();
            savingsCat = createdCat;
          }

          await tx.insert(transactions).values({
            userId,
            type: "EXPENSE",
            amount: validated.amount,
            date: validated.date,
            note: validated.note ? `Setor tabungan ${goal.name}: ${validated.note}` : `Setor tabungan: ${goal.name}`,
            accountId: validated.accountId,
            categoryId: savingsCat?.id || null,
            excludeFromStats: true,
          });
        } else if (validated.type === "WITHDRAW") {
          // Tarik: saldo rekening bertambah
          await tx
            .update(accounts)
            .set({
              currentBalance: sql`${accounts.currentBalance} + ${validated.amount}`,
            })
            .where(eq(accounts.id, validated.accountId));

          let [savingsCat] = await tx
            .select()
            .from(categories)
            .where(and(eq(categories.userId, userId), eq(categories.name, "Tabungan")))
            .limit(1);

          if (!savingsCat) {
            const [createdCat] = await tx
              .insert(categories)
              .values({
                userId,
                name: "Tabungan",
                type: "INCOME",
                color: "#09090B",
                icon: "PiggyBank",
                isSystem: true,
              })
              .returning();
            savingsCat = createdCat;
          }

          await tx.insert(transactions).values({
            userId,
            type: "INCOME",
            amount: validated.amount,
            date: validated.date,
            note: validated.note ? `Tarik tabungan ${goal.name}: ${validated.note}` : `Tarik tabungan: ${goal.name}`,
            accountId: validated.accountId,
            categoryId: savingsCat?.id || null,
            excludeFromStats: true,
          });
        } else if (validated.type === "YIELD") {
          // Imbal hasil / bunga RDPU: saldo rekening bertambah
          await tx
            .update(accounts)
            .set({
              currentBalance: sql`${accounts.currentBalance} + ${validated.amount}`,
            })
            .where(eq(accounts.id, validated.accountId));

          let [yieldCat] = await tx
            .select()
            .from(categories)
            .where(and(eq(categories.userId, userId), eq(categories.name, "Imbal Hasil Tabungan")))
            .limit(1);

          if (!yieldCat) {
            const [createdCat] = await tx
              .insert(categories)
              .values({
                userId,
                name: "Imbal Hasil Tabungan",
                type: "INCOME",
                color: "#059669",
                icon: "TrendingUp",
                isSystem: true,
              })
              .returning();
            yieldCat = createdCat;
          }

          await tx.insert(transactions).values({
            userId,
            type: "INCOME",
            amount: validated.amount,
            date: validated.date,
            note: validated.note ? `Imbal hasil ${goal.name}: ${validated.note}` : `Imbal hasil tabungan: ${goal.name}`,
            accountId: validated.accountId,
            categoryId: yieldCat?.id || null,
            excludeFromStats: true,
          });
        }
      }

      // 5. Catat riwayat savings_transactions
      const [createdSavingsTx] = await tx
        .insert(savingsTransactions)
        .values({
          savingsGoalId: id,
          userId,
          type: validated.type,
          amount: validated.amount,
          fromAccountId: validated.type === "DEPOSIT" ? validated.accountId || null : null,
          toAccountId: validated.type === "WITHDRAW" || validated.type === "YIELD" ? validated.accountId || null : null,
          note: validated.note || null,
          date: validated.date,
        })
        .returning();

      // 6. Update currentAmount & totalYieldEarned pada target tabungan
      const amountDiff = validated.type === "WITHDRAW" ? -validated.amount : validated.amount;
      const yieldDiff = validated.type === "YIELD" ? validated.amount : 0;

      await tx
        .update(savingsGoals)
        .set({
          currentAmount: sql`GREATEST(0, ${savingsGoals.currentAmount} + ${amountDiff})`,
          totalYieldEarned: sql`${savingsGoals.totalYieldEarned} + ${yieldDiff}`,
        })
        .where(eq(savingsGoals.id, id));

      return createdSavingsTx;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error("POST savings transaction error:", error);
    const message = error instanceof Error ? error.message : "Gagal memproses transaksi tabungan";
    return NextResponse.json({ message }, { status: 400 });
  }
}


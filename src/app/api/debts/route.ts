import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/current-user";
import { db } from "@/db";
import { accounts, categories, debts, transactions } from "@/db/schema";
import { debtFormSchema } from "@/lib/validations";
import { and, desc, eq, sql } from "drizzle-orm";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });
  }

  try {
    const list = await db.query.debts.findMany({
      where: eq(debts.userId, userId),
      orderBy: [desc(debts.createdAt)],
      with: {
        account: true,
        payments: {
          with: {
            account: true,
          },
          orderBy: (payments, { desc: pDesc }) => [pDesc(payments.date)],
        },
      },
    });

    let totalDebt = 0;
    let totalLoan = 0;

    for (const item of list) {
      if (item.status !== "PAID") {
        if (item.type === "DEBT") {
          totalDebt += Number(item.remainingAmount);
        } else if (item.type === "LOAN") {
          totalLoan += Number(item.remainingAmount);
        }
      }
    }

    return NextResponse.json({
      debts: list,
      summary: {
        totalDebt,
        totalLoan,
      },
    });
  } catch (error: unknown) {
    console.error("GET debts error:", error);
    return NextResponse.json({ message: "Gagal memuat daftar hutang & piutang" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = debtFormSchema.parse(body);

    const created = await db.transaction(async (tx) => {
      const [newDebt] = await tx
        .insert(debts)
        .values({
          userId,
          type: validated.type,
          personName: validated.personName,
          amount: validated.amount,
          remainingAmount: validated.amount,
          accountId: validated.accountId || null,
          dueDate: validated.dueDate || null,
          note: validated.note || null,
          status: "UNPAID",
        })
        .returning();

      // Jika pengguna memilih rekening, sesuaikan saldo rekening & buat transaksi dengan excludeFromStats: true
      if (validated.accountId) {
        const [targetAccount] = await tx
          .select()
          .from(accounts)
          .where(and(eq(accounts.id, validated.accountId), eq(accounts.userId, userId)))
          .limit(1);

        if (!targetAccount) {
          throw new Error("Rekening yang dipilih tidak ditemukan");
        }

        if (validated.type === "DEBT") {
          // Hutang saya: kita menerima uang pinjaman (saldo rekening bertambah)
          await tx
            .update(accounts)
            .set({
              currentBalance: sql`${accounts.currentBalance} + ${validated.amount}`,
            })
            .where(eq(accounts.id, validated.accountId));

          let [hutangCategory] = await tx
            .select()
            .from(categories)
            .where(
              and(
                eq(categories.userId, userId),
                eq(categories.name, "Pencairan Pinjaman"),
                eq(categories.type, "INCOME")
              )
            )
            .limit(1);

          if (!hutangCategory) {
            const [createdCategory] = await tx
              .insert(categories)
              .values({
                userId,
                name: "Pencairan Pinjaman",
                type: "INCOME",
                color: "#71717A",
                icon: "Tag",
                isSystem: true,
              })
              .returning();
            hutangCategory = createdCategory;
          }

          await tx.insert(transactions).values({
            userId,
            type: "INCOME",
            amount: validated.amount,
            date: new Date(),
            note: validated.note
              ? `Pencairan pinjaman dari ${validated.personName} (${validated.note})`
              : `Pencairan pinjaman dari ${validated.personName}`,
            accountId: validated.accountId,
            categoryId: hutangCategory?.id || null,
            excludeFromStats: true,
          });
        } else if (validated.type === "LOAN") {
          // Piutang saya: kita memberikan uang pinjaman ke orang lain (saldo rekening berkurang)
          await tx
            .update(accounts)
            .set({
              currentBalance: sql`${accounts.currentBalance} - ${validated.amount}`,
            })
            .where(eq(accounts.id, validated.accountId));

          let [piutangCategory] = await tx
            .select()
            .from(categories)
            .where(
              and(
                eq(categories.userId, userId),
                eq(categories.name, "Pemberian Pinjaman"),
                eq(categories.type, "EXPENSE")
              )
            )
            .limit(1);

          if (!piutangCategory) {
            const [createdCategory] = await tx
              .insert(categories)
              .values({
                userId,
                name: "Pemberian Pinjaman",
                type: "EXPENSE",
                color: "#71717A",
                icon: "Tag",
                isSystem: true,
              })
              .returning();
            piutangCategory = createdCategory;
          }

          await tx.insert(transactions).values({
            userId,
            type: "EXPENSE",
            amount: validated.amount,
            date: new Date(),
            note: validated.note
              ? `Pemberian pinjaman ke ${validated.personName} (${validated.note})`
              : `Pemberian pinjaman ke ${validated.personName}`,
            accountId: validated.accountId,
            categoryId: piutangCategory?.id || null,
            excludeFromStats: true,
          });
        }
      }

      return newDebt;
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: unknown) {
    console.error("POST debts error:", error);
    const message = error instanceof Error ? error.message : "Gagal menambahkan catatan hutang/piutang";
    return NextResponse.json({ message }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/current-user";
import { db } from "@/db";
import { accounts, categories, transactions } from "@/db/schema";
import { transactionFormSchema, transactionFilterSchema } from "@/lib/validations";
import { and, eq, gte, lte, ilike, desc, sql } from "drizzle-orm";
import { endOfMonth, startOfMonth } from "date-fns";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const filterInput = {
      month: searchParams.get("month") || undefined,
      year: searchParams.get("year") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      accountId: searchParams.get("accountId") || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      type: searchParams.get("type") || undefined,
      search: searchParams.get("search") || undefined,
      minAmount: searchParams.get("minAmount") || undefined,
      maxAmount: searchParams.get("maxAmount") || undefined,
      limit: searchParams.get("limit") || 50,
      offset: searchParams.get("offset") || 0,
    };

    const validatedFilter = transactionFilterSchema.parse(filterInput);

    // Build conditions
    const conditions = [eq(transactions.userId, userId)];

    if (validatedFilter.month && validatedFilter.year) {
      const start = startOfMonth(new Date(validatedFilter.year, validatedFilter.month - 1));
      const end = endOfMonth(new Date(validatedFilter.year, validatedFilter.month - 1));
      conditions.push(gte(transactions.date, start));
      conditions.push(lte(transactions.date, end));
    } else {
      if (validatedFilter.startDate) {
        conditions.push(gte(transactions.date, new Date(validatedFilter.startDate)));
      }
      if (validatedFilter.endDate) {
        conditions.push(lte(transactions.date, new Date(validatedFilter.endDate)));
      }
    }

    if (validatedFilter.accountId) {
      conditions.push(eq(transactions.accountId, validatedFilter.accountId));
    }

    if (validatedFilter.categoryId) {
      conditions.push(eq(transactions.categoryId, validatedFilter.categoryId));
    }

    if (validatedFilter.type) {
      conditions.push(eq(transactions.type, validatedFilter.type));
    }

    if (validatedFilter.search && validatedFilter.search.trim()) {
      conditions.push(ilike(transactions.note, `%${validatedFilter.search.trim()}%`));
    }

    if (validatedFilter.minAmount !== undefined) {
      conditions.push(gte(transactions.amount, validatedFilter.minAmount));
    }

    if (validatedFilter.maxAmount !== undefined) {
      conditions.push(lte(transactions.amount, validatedFilter.maxAmount));
    }

    // Query with relations
    const txList = await db.query.transactions.findMany({
      where: and(...conditions),
      orderBy: [desc(transactions.date), desc(transactions.createdAt)],
      limit: validatedFilter.limit,
      offset: validatedFilter.offset,
      with: {
        account: true,
        toAccount: true,
        category: true,
      },
    });

    return NextResponse.json(txList);
  } catch (error) {
    console.error("GET transactions error:", error);
    return NextResponse.json({ message: "Gagal memuat transaksi" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = transactionFormSchema.parse(body);

    const result = await db.transaction(async (tx) => {
      // 1. EXPENSE
      if (validated.type === "EXPENSE") {
        const [sourceAccount] = await tx
          .select()
          .from(accounts)
          .where(and(eq(accounts.id, validated.accountId), eq(accounts.userId, userId)))
          .limit(1);

        if (!sourceAccount) {
          throw new Error("Rekening tidak ditemukan");
        }

        // Insert Expense
        const [insertedTx] = await tx
          .insert(transactions)
          .values({
            userId,
            type: "EXPENSE",
            amount: validated.amount,
            date: validated.date,
            note: validated.note || null,
            accountId: validated.accountId,
            categoryId: validated.categoryId || null,
          })
          .returning();

        // Deduct source account balance
        await tx
          .update(accounts)
          .set({
            currentBalance: sql`${accounts.currentBalance} - ${validated.amount}`,
          })
          .where(eq(accounts.id, validated.accountId));

        return insertedTx;
      }

      // 2. INCOME
      if (validated.type === "INCOME") {
        const [targetAccount] = await tx
          .select()
          .from(accounts)
          .where(and(eq(accounts.id, validated.accountId), eq(accounts.userId, userId)))
          .limit(1);

        if (!targetAccount) {
          throw new Error("Rekening tidak ditemukan");
        }

        // Insert Income
        const [insertedTx] = await tx
          .insert(transactions)
          .values({
            userId,
            type: "INCOME",
            amount: validated.amount,
            date: validated.date,
            note: validated.note || null,
            accountId: validated.accountId,
            categoryId: validated.categoryId || null,
          })
          .returning();

        // Add to account balance
        await tx
          .update(accounts)
          .set({
            currentBalance: sql`${accounts.currentBalance} + ${validated.amount}`,
          })
          .where(eq(accounts.id, validated.accountId));

        return insertedTx;
      }

      // 3. TRANSFER
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

        // Insert primary Transfer record
        const [transferTx] = await tx
          .insert(transactions)
          .values({
            userId,
            type: "TRANSFER",
            amount: validated.amount,
            date: validated.date,
            note: validated.note || null,
            accountId: validated.accountId,
            toAccountId: validated.toAccountId,
          })
          .returning();

        // If admin fee > 0, insert separate EXPENSE record
        if (adminFee > 0) {
          // Find or create "Biaya Admin" category
          let [adminCategory] = await tx
            .select()
            .from(categories)
            .where(
              and(
                eq(categories.userId, userId),
                eq(categories.name, "Biaya Admin")
              )
            )
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
            parentTransferId: transferTx.id,
          });
        }

        // Deduct from source account: amount + adminFee
        const totalDeduction = validated.amount + adminFee;
        await tx
          .update(accounts)
          .set({
            currentBalance: sql`${accounts.currentBalance} - ${totalDeduction}`,
          })
          .where(eq(accounts.id, validated.accountId));

        // Add to destination account: amount
        await tx
          .update(accounts)
          .set({
            currentBalance: sql`${accounts.currentBalance} + ${validated.amount}`,
          })
          .where(eq(accounts.id, validated.toAccountId));

        return transferTx;
      }

      throw new Error("Tipe transaksi tidak valid");
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error("POST transaction error:", error);
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json({ message: "Data tidak valid", errors: error }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Gagal mencatat transaksi";
    return NextResponse.json({ message }, { status: 400 });
  }
}

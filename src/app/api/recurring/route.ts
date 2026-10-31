import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/current-user";
import { db } from "@/db";
import { recurringTransactions, categories } from "@/db/schema";
import { recurringFormSchema } from "@/lib/validations";
import { desc, eq } from "drizzle-orm";
import { processDueRecurringTransactions } from "@/lib/recurring-processor";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });
  }

  try {
    // Otomatis proses jadwal yang telah jatuh tempo untuk user saat memuat data
    await processDueRecurringTransactions(userId);

    const list = await db.query.recurringTransactions.findMany({
      where: eq(recurringTransactions.userId, userId),
      orderBy: [desc(recurringTransactions.createdAt)],
      with: {
        account: true,
        toAccount: true,
        category: true,
      },
    });

    return NextResponse.json(list);
  } catch (error: unknown) {
    console.error("GET recurring error:", error);
    return NextResponse.json({ message: "Gagal memuat transaksi berulang" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = recurringFormSchema.parse(body);

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

    const [created] = await db
      .insert(recurringTransactions)
      .values({
        userId,
        type: validated.type,
        amount: validated.amount,
        accountId: validated.accountId,
        toAccountId: validated.toAccountId || null,
        categoryId: validated.categoryId || null,
        note: validated.note || null,
        frequency: validated.frequency,
        startDate: validated.startDate,
        nextRunDate: validated.startDate,
        isActive: true,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error: unknown) {
    console.error("POST recurring error:", error);
    const message = error instanceof Error ? error.message : "Gagal menambahkan transaksi berulang";
    return NextResponse.json({ message }, { status: 400 });
  }
}

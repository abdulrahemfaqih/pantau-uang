import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/current-user";
import { db } from "@/db";
import { debts } from "@/db/schema";
import { debtFormSchema } from "@/lib/validations";
import { desc, eq } from "drizzle-orm";

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

    const [created] = await db
      .insert(debts)
      .values({
        userId,
        type: validated.type,
        personName: validated.personName,
        amount: validated.amount,
        remainingAmount: validated.amount,
        dueDate: validated.dueDate || null,
        note: validated.note || null,
        status: "UNPAID",
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error: unknown) {
    console.error("POST debts error:", error);
    const message = error instanceof Error ? error.message : "Gagal menambahkan catatan hutang/piutang";
    return NextResponse.json({ message }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/current-user";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { accountFormSchema } from "@/lib/validations";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });
  }

  try {
    const userAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, userId))
      .orderBy(desc(accounts.createdAt));

    return NextResponse.json(userAccounts);
  } catch (error) {
    console.error("GET accounts error:", error);
    return NextResponse.json({ message: "Gagal mengambil data rekening" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = accountFormSchema.parse(body);

    const [newAccount] = await db
      .insert(accounts)
      .values({
        userId,
        name: validated.name,
        type: validated.type,
        initialBalance: validated.initialBalance,
        currentBalance: validated.initialBalance,
        color: validated.color,
        icon: validated.icon,
        excludeFromTotal: validated.excludeFromTotal,
      })
      .returning();

    return NextResponse.json(newAccount, { status: 201 });
  } catch (error: unknown) {
    console.error("POST accounts error:", error);
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json({ message: "Data tidak valid", errors: error }, { status: 400 });
    }
    return NextResponse.json({ message: "Gagal membuat rekening baru" }, { status: 500 });
  }
}

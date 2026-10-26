import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/current-user";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { accountFormSchema } from "@/lib/validations";
import { and, eq } from "drizzle-orm";

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
    const partialSchema = accountFormSchema.partial();
    const validated = partialSchema.parse(body);

    const [updated] = await db
      .update(accounts)
      .set(validated)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
      .returning();

    if (!updated) {
      return NextResponse.json({ message: "Rekening tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error("PUT account error:", error);
    return NextResponse.json({ message: "Gagal memperbarui rekening" }, { status: 500 });
  }
}

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
    const [deleted] = await db
      .delete(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ message: "Rekening tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ message: "Rekening berhasil dihapus" });
  } catch (error) {
    console.error("DELETE account error:", error);
    return NextResponse.json({ message: "Gagal menghapus rekening" }, { status: 500 });
  }
}

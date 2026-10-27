import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/current-user";
import { db } from "@/db";
import { recurringTransactions } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function PATCH(
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
    const { isActive } = body;

    const [updated] = await db
      .update(recurringTransactions)
      .set({
        isActive: Boolean(isActive),
      })
      .where(
        and(
          eq(recurringTransactions.id, id),
          eq(recurringTransactions.userId, userId)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json({ message: "Jadwal transaksi berulang tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error("PATCH recurring error:", error);
    const message = error instanceof Error ? error.message : "Gagal memperbarui status transaksi berulang";
    return NextResponse.json({ message }, { status: 400 });
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
    await db
      .delete(recurringTransactions)
      .where(
        and(
          eq(recurringTransactions.id, id),
          eq(recurringTransactions.userId, userId)
        )
      );

    return NextResponse.json({ message: "Jadwal transaksi berulang berhasil dihapus" });
  } catch (error: unknown) {
    console.error("DELETE recurring error:", error);
    const message = error instanceof Error ? error.message : "Gagal menghapus jadwal transaksi berulang";
    return NextResponse.json({ message }, { status: 400 });
  }
}

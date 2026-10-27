import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/current-user";
import { db } from "@/db";
import { debts } from "@/db/schema";
import { and, eq } from "drizzle-orm";

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
      .delete(debts)
      .where(
        and(
          eq(debts.id, id),
          eq(debts.userId, userId)
        )
      );

    return NextResponse.json({ message: "Catatan hutang/piutang berhasil dihapus" });
  } catch (error: unknown) {
    console.error("DELETE debt error:", error);
    const message = error instanceof Error ? error.message : "Gagal menghapus catatan hutang/piutang";
    return NextResponse.json({ message }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/current-user";
import { db } from "@/db";
import { savingsGoals, savingsMembers } from "@/db/schema";
import { savingsJoinFormSchema } from "@/lib/validations";
import { and, eq, ilike } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = savingsJoinFormSchema.parse(body);

    const cleanCode = validated.inviteCode.trim().toUpperCase();

    // 1. Cari target tabungan berdasarkan kode undangan
    const [targetGoal] = await db
      .select()
      .from(savingsGoals)
      .where(ilike(savingsGoals.inviteCode, cleanCode))
      .limit(1);

    if (!targetGoal) {
      return NextResponse.json({ message: "Kode undangan tidak ditemukan atau tidak valid" }, { status: 404 });
    }

    if (targetGoal.status !== "ACTIVE") {
      return NextResponse.json({ message: "Tabungan bersama ini sudah tidak aktif" }, { status: 400 });
    }

    // 2. Cek apakah pengguna sudah bergabung
    const [existingMember] = await db
      .select()
      .from(savingsMembers)
      .where(and(eq(savingsMembers.savingsGoalId, targetGoal.id), eq(savingsMembers.userId, userId)))
      .limit(1);

    if (existingMember) {
      return NextResponse.json(
        { message: "Anda sudah menjadi anggota di tabungan ini", goal: targetGoal },
        { status: 200 }
      );
    }

    // 3. Daftarkan sebagai anggota baru
    await db.insert(savingsMembers).values({
      savingsGoalId: targetGoal.id,
      userId,
      role: "MEMBER",
    });

    return NextResponse.json(
      { message: `Berhasil bergabung ke tabungan ${targetGoal.name}`, goal: targetGoal },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST join savings error:", error);
    const message = error instanceof Error ? error.message : "Gagal bergabung ke tabungan";
    return NextResponse.json({ message }, { status: 400 });
  }
}


import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/current-user";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const driverModeSchema = z.object({
  isDriver: z.boolean(),
});

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });
  }

  try {
    const [user] = await db
      .select({ isDriver: users.isDriver })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ message: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ isDriver: user.isDriver });
  } catch (error) {
    console.error("GET driver-mode error:", error);
    return NextResponse.json({ message: "Gagal memuat preferensi pengguna" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = driverModeSchema.parse(body);

    const [updatedUser] = await db
      .update(users)
      .set({ isDriver: validated.isDriver })
      .where(eq(users.id, userId))
      .returning({ isDriver: users.isDriver });

    if (!updatedUser) {
      return NextResponse.json({ message: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      message: `Mode driver berhasil ${validated.isDriver ? "diaktifkan" : "dinonaktifkan"}`,
      isDriver: updatedUser.isDriver,
    });
  } catch (error: unknown) {
    console.error("PATCH driver-mode error:", error);
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json({ message: "Data tidak valid", errors: error }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Gagal memperbarui preferensi mode driver";
    return NextResponse.json({ message }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/current-user";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { categoryFormSchema } from "@/lib/validations";
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
    const partialSchema = categoryFormSchema.partial();
    const validated = partialSchema.parse(body);

    const [updated] = await db
      .update(categories)
      .set(validated)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning();

    if (!updated) {
      return NextResponse.json({ message: "Kategori tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error("PUT category error:", error);
    return NextResponse.json({ message: "Gagal memperbarui kategori" }, { status: 500 });
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
    // Check if category is system category (e.g. Biaya Admin)
    const [target] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .limit(1);

    if (!target) {
      return NextResponse.json({ message: "Kategori tidak ditemukan" }, { status: 404 });
    }

    if (target.isSystem) {
      return NextResponse.json(
        { message: "Kategori sistem tidak dapat dihapus" },
        { status: 400 }
      );
    }

    await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)));

    return NextResponse.json({ message: "Kategori berhasil dihapus" });
  } catch (error) {
    console.error("DELETE category error:", error);
    return NextResponse.json({ message: "Gagal menghapus kategori" }, { status: 500 });
  }
}

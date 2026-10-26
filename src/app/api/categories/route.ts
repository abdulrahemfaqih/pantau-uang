import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/current-user";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { categoryFormSchema } from "@/lib/validations";
import { eq, desc } from "drizzle-orm";
import { seedDefaultCategories } from "@/lib/seed";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });
  }

  try {
    let userCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId))
      .orderBy(desc(categories.createdAt));

    if (userCategories.length === 0) {
      await seedDefaultCategories(userId);
      userCategories = await db
        .select()
        .from(categories)
        .where(eq(categories.userId, userId))
        .orderBy(desc(categories.createdAt));
    }

    return NextResponse.json(userCategories);
  } catch (error) {
    console.error("GET categories error:", error);
    return NextResponse.json({ message: "Gagal mengambil data kategori" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = categoryFormSchema.parse(body);

    const [newCategory] = await db
      .insert(categories)
      .values({
        userId,
        name: validated.name,
        type: validated.type,
        color: validated.color,
        icon: validated.icon,
        isSystem: false,
      })
      .returning();

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error: unknown) {
    console.error("POST categories error:", error);
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json({ message: "Data tidak valid", errors: error }, { status: 400 });
    }
    return NextResponse.json({ message: "Gagal membuat kategori baru" }, { status: 500 });
  }
}

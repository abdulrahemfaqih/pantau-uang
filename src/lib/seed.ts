import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Makan & Minum", type: "EXPENSE" as const, color: "#71717A", icon: "Utensils", isSystem: false },
  { name: "Transportasi/Bensin", type: "EXPENSE" as const, color: "#71717A", icon: "Car", isSystem: false },
  { name: "Tagihan", type: "EXPENSE" as const, color: "#71717A", icon: "Receipt", isSystem: false },
  { name: "Belanja", type: "EXPENSE" as const, color: "#71717A", icon: "ShoppingBag", isSystem: false },
  { name: "Biaya Admin", type: "EXPENSE" as const, color: "#71717A", icon: "Landmark", isSystem: true },
];

export const DEFAULT_INCOME_CATEGORIES = [
  { name: "Gaji", type: "INCOME" as const, color: "#71717A", icon: "Briefcase", isSystem: false },
  { name: "Proyek Freelance", type: "INCOME" as const, color: "#71717A", icon: "Laptop", isSystem: false },
  { name: "Bonus", type: "INCOME" as const, color: "#71717A", icon: "Gift", isSystem: false },
  { name: "Lainnya", type: "INCOME" as const, color: "#71717A", icon: "CircleDollarSign", isSystem: false },
];

export async function seedDefaultCategories(userId: string) {
  try {
    const existing = await db.select().from(categories).where(eq(categories.userId, userId));
    if (existing.length > 0) return;

    const allDefaults = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES].map((cat) => ({
      ...cat,
      userId,
    }));

    await db.insert(categories).values(allDefaults);
  } catch (error) {
    console.error("Gagal inisialisasi kategori bawaan:", error);
  }
}

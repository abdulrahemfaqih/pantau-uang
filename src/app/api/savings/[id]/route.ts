import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/current-user";
import { db } from "@/db";
import { savingsGoals, savingsMembers, savingsTransactions } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Pastikan user adalah member atau owner dari goal ini
    const [membership] = await db
      .select()
      .from(savingsMembers)
      .where(and(eq(savingsMembers.savingsGoalId, id), eq(savingsMembers.userId, userId)))
      .limit(1);

    if (!membership) {
      return NextResponse.json({ message: "Tabungan tidak ditemukan atau Anda bukan anggota" }, { status: 404 });
    }

    const goal = await db.query.savingsGoals.findFirst({
      where: eq(savingsGoals.id, id),
      with: {
        owner: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        members: {
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        transactions: {
          orderBy: [desc(savingsTransactions.date), desc(savingsTransactions.createdAt)],
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                image: true,
              },
            },
            fromAccount: true,
            toAccount: true,
          },
        },
      },
    });

    if (!goal) {
      return NextResponse.json({ message: "Tabungan tidak ditemukan" }, { status: 404 });
    }

    // Hitung kontribusi per user
    let totalSaved = 0;
    let myContribution = 0;
    const memberContributions = new Map<string, number>();

    for (const tx of goal.transactions) {
      const amt = Number(tx.amount);
      const currentMemberAmt = memberContributions.get(tx.userId) || 0;

      if (tx.type === "DEPOSIT") {
        totalSaved += amt;
        memberContributions.set(tx.userId, currentMemberAmt + amt);
        if (tx.userId === userId) {
          myContribution += amt;
        }
      } else if (tx.type === "WITHDRAW") {
        totalSaved -= amt;
        memberContributions.set(tx.userId, currentMemberAmt - amt);
        if (tx.userId === userId) {
          myContribution -= amt;
        }
      }
    }

    const percentage = goal.targetAmount > 0 ? Math.min(100, Math.round((totalSaved / Number(goal.targetAmount)) * 100)) : 0;

    const membersWithContribution = goal.members.map((m) => {
      const userAmt = Math.max(0, memberContributions.get(m.userId) || 0);
      const memberPct = totalSaved > 0 ? Math.round((userAmt / totalSaved) * 100) : 0;
      return {
        ...m,
        contributionAmount: userAmt,
        contributionPercentage: memberPct,
      };
    });

    return NextResponse.json({
      ...goal,
      currentAmount: totalSaved,
      myContribution,
      percentage,
      isOwner: goal.userId === userId,
      role: membership.role,
      members: membersWithContribution,
    });
  } catch (error: unknown) {
    console.error("GET savings by id error:", error);
    return NextResponse.json({ message: "Gagal memuat detail tabungan" }, { status: 500 });
  }
}

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
    const [goal] = await db
      .select()
      .from(savingsGoals)
      .where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, userId)))
      .limit(1);

    if (!goal) {
      return NextResponse.json({ message: "Hanya pemilik tabungan yang dapat mengubah data" }, { status: 403 });
    }

    const body = await req.json();

    const updatePayload: Partial<typeof savingsGoals.$inferInsert> = {};
    if (body.name !== undefined) updatePayload.name = body.name;
    if (body.targetAmount !== undefined) updatePayload.targetAmount = Number(body.targetAmount);
    if (body.targetDate !== undefined) updatePayload.targetDate = body.targetDate ? new Date(body.targetDate) : null;
    if (body.color !== undefined) updatePayload.color = body.color;
    if (body.icon !== undefined) updatePayload.icon = body.icon;
    if (body.status !== undefined) updatePayload.status = body.status;

    const [updated] = await db
      .update(savingsGoals)
      .set(updatePayload)
      .where(eq(savingsGoals.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error("PATCH savings error:", error);
    return NextResponse.json({ message: "Gagal memperbarui tabungan" }, { status: 500 });
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
    const [membership] = await db
      .select()
      .from(savingsMembers)
      .where(and(eq(savingsMembers.savingsGoalId, id), eq(savingsMembers.userId, userId)))
      .limit(1);

    if (!membership) {
      return NextResponse.json({ message: "Tabungan tidak ditemukan" }, { status: 404 });
    }

    if (membership.role === "OWNER") {
      // Hapus target tabungan seluruhnya (cascade akan menghapus members & transactions)
      await db.delete(savingsGoals).where(eq(savingsGoals.id, id));
      return NextResponse.json({ message: "Target tabungan berhasil dihapus" });
    } else {
      // Jika member biasa, keluar dari tabungan bersama
      await db
        .delete(savingsMembers)
        .where(and(eq(savingsMembers.savingsGoalId, id), eq(savingsMembers.userId, userId)));
      return NextResponse.json({ message: "Berhasil keluar dari tabungan bersama" });
    }
  } catch (error: unknown) {
    console.error("DELETE savings error:", error);
    return NextResponse.json({ message: "Gagal menghapus tabungan" }, { status: 500 });
  }
}


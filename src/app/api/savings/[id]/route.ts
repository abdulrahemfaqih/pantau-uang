import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/current-user";
import { db } from "@/db";
import { accounts, savingsGoals, savingsMembers, savingsTransactions, transactions } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";

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
    let totalYield = 0;
    let principalAmount = 0;
    let myContribution = 0;
    let myYield = 0;
    const memberContributions = new Map<string, number>();

    for (const tx of goal.transactions) {
      const amt = Number(tx.amount);
      const currentMemberAmt = memberContributions.get(tx.userId) || 0;

      if (tx.type === "DEPOSIT") {
        totalSaved += amt;
        principalAmount += amt;
        memberContributions.set(tx.userId, currentMemberAmt + amt);
        if (tx.userId === userId) {
          myContribution += amt;
        }
      } else if (tx.type === "WITHDRAW") {
        totalSaved -= amt;
        principalAmount -= amt;
        memberContributions.set(tx.userId, currentMemberAmt - amt);
        if (tx.userId === userId) {
          myContribution -= amt;
        }
      } else if (tx.type === "YIELD") {
        totalSaved += amt;
        totalYield += amt;
        memberContributions.set(tx.userId, currentMemberAmt + amt);
        if (tx.userId === userId) {
          myContribution += amt;
          myYield += amt;
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
      totalYieldEarned: totalYield,
      principalAmount: Math.max(0, principalAmount),
      myContribution,
      myYield,
      percentage,
      isOwner: goal.userId === userId,
      currentUserId: userId,
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

    await db.transaction(async (tx) => {
      if (membership.role === "OWNER") {
        // 1. Ambil info target tabungan
        const [goal] = await tx
          .select()
          .from(savingsGoals)
          .where(eq(savingsGoals.id, id))
          .limit(1);

        // 2. Ambil seluruh transaksi tabungan untuk merefund saldo rekening yang pernah dipotong
        const txList = await tx
          .select()
          .from(savingsTransactions)
          .where(eq(savingsTransactions.savingsGoalId, id));

        for (const t of txList) {
          const amt = Number(t.amount);
          if (t.type === "DEPOSIT" && t.fromAccountId) {
            // Refund uang setoran kembali ke rekening asal
            await tx
              .update(accounts)
              .set({
                currentBalance: sql`${accounts.currentBalance} + ${amt}`,
              })
              .where(eq(accounts.id, t.fromAccountId));
          } else if (t.type === "WITHDRAW" && t.toAccountId) {
            // Revert penarikan
            await tx
              .update(accounts)
              .set({
                currentBalance: sql`GREATEST(0, ${accounts.currentBalance} - ${amt})`,
              })
              .where(eq(accounts.id, t.toAccountId));
          } else if (t.type === "YIELD" && t.toAccountId) {
            // Revert imbal hasil yang pernah dikreditkan ke rekening
            await tx
              .update(accounts)
              .set({
                currentBalance: sql`GREATEST(0, ${accounts.currentBalance} - ${amt})`,
              })
              .where(eq(accounts.id, t.toAccountId));
          }
        }

        // 3. Bersihkan mutasi transaksi sistem yang terkait tabungan ini
        if (goal) {
          await tx
            .delete(transactions)
            .where(
              and(
                eq(transactions.excludeFromStats, true),
                sql`${transactions.note} LIKE ${`%${goal.name}%`}`
              )
            );
        }

        // 4. Hapus target tabungan (cascade akan menghapus savingsMembers & savingsTransactions)
        await tx.delete(savingsGoals).where(eq(savingsGoals.id, id));
      } else {
        // Jika member biasa, refund kontribusi member ini dan keluarkan dari tabungan
        const userTxList = await tx
          .select()
          .from(savingsTransactions)
          .where(and(eq(savingsTransactions.savingsGoalId, id), eq(savingsTransactions.userId, userId)));

        for (const t of userTxList) {
          const amt = Number(t.amount);
          if (t.type === "DEPOSIT" && t.fromAccountId) {
            await tx
              .update(accounts)
              .set({
                currentBalance: sql`${accounts.currentBalance} + ${amt}`,
              })
              .where(eq(accounts.id, t.fromAccountId));
          } else if (t.type === "WITHDRAW" && t.toAccountId) {
            await tx
              .update(accounts)
              .set({
                currentBalance: sql`GREATEST(0, ${accounts.currentBalance} - ${amt})`,
              })
              .where(eq(accounts.id, t.toAccountId));
          }
        }

        await tx
          .delete(savingsTransactions)
          .where(and(eq(savingsTransactions.savingsGoalId, id), eq(savingsTransactions.userId, userId)));

        await tx
          .delete(savingsMembers)
          .where(and(eq(savingsMembers.savingsGoalId, id), eq(savingsMembers.userId, userId)));
      }
    });

    return NextResponse.json({ message: "Tabungan berhasil dihapus dan saldo telah disinkronkan kembali" });
  } catch (error: unknown) {
    console.error("DELETE savings error:", error);
    return NextResponse.json({ message: "Gagal menghapus tabungan" }, { status: 500 });
  }
}


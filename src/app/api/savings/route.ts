import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/current-user";
import { db } from "@/db";
import { accounts, categories, savingsGoals, savingsMembers, savingsTransactions, transactions } from "@/db/schema";
import { savingsGoalFormSchema } from "@/lib/validations";
import { desc, eq, inArray, sql, and } from "drizzle-orm";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "PU-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });
  }

  try {
    // 1. Cari semua goal ID di mana user adalah owner atau member
    const userMemberships = await db
      .select({ goalId: savingsMembers.savingsGoalId })
      .from(savingsMembers)
      .where(eq(savingsMembers.userId, userId));

    const goalIds = userMemberships.map((m) => m.goalId);

    if (goalIds.length === 0) {
      return NextResponse.json({
        savings: [],
        summary: {
          totalSaved: 0,
          myTotalSaved: 0,
          activeGoalsCount: 0,
        },
      });
    }

    // 2. Ambil data goals beserta members dan transactions
    const goalsList = await db.query.savingsGoals.findMany({
      where: inArray(savingsGoals.id, goalIds),
      orderBy: [desc(savingsGoals.createdAt)],
      with: {
        owner: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        linkedAccount: true,
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
          orderBy: [desc(savingsTransactions.date)],
          with: {
            user: {
              columns: {
                id: true,
                name: true,
              },
            },
            fromAccount: true,
            toAccount: true,
          },
        },
      },
    });

    let overallTotalSaved = 0;
    let myOverallSaved = 0;
    let activeGoalsCount = 0;

    const formattedGoals = goalsList.map((g) => {
      let totalSaved = 0;
      let totalYield = 0;
      let principalAmount = 0;
      let myContribution = 0;
      let myYield = 0;

      // Hitung kontribusi per user
      const memberContributions = new Map<string, number>();

      for (const tx of g.transactions) {
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

      if (g.status === "ACTIVE") {
        activeGoalsCount++;
        overallTotalSaved += totalSaved;
        myOverallSaved += myContribution;
      }

      const percentage = g.targetAmount > 0 ? Math.min(100, Math.round((totalSaved / Number(g.targetAmount)) * 100)) : 0;

      // Format rincian kontribusi anggota
      const membersWithContribution = g.members.map((m) => {
        const userAmt = Math.max(0, memberContributions.get(m.userId) || 0);
        const memberPct = totalSaved > 0 ? Math.round((userAmt / totalSaved) * 100) : 0;
        return {
          ...m,
          contributionAmount: userAmt,
          contributionPercentage: memberPct,
        };
      });

      return {
        ...g,
        currentAmount: totalSaved,
        totalYieldEarned: totalYield,
        principalAmount: Math.max(0, principalAmount),
        myContribution,
        myYield,
        percentage,
        isOwner: g.userId === userId,
        membersCount: g.members.length,
        members: membersWithContribution,
        recentTransactions: g.transactions.slice(0, 5),
      };
    });

    return NextResponse.json({
      savings: formattedGoals,
      summary: {
        totalSaved: overallTotalSaved,
        myTotalSaved: myOverallSaved,
        activeGoalsCount,
      },
    });
  } catch (error: unknown) {
    console.error("GET savings error:", error);
    return NextResponse.json({ message: "Gagal memuat daftar tabungan" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = savingsGoalFormSchema.parse(body);

    const inviteCode = validated.isShared ? generateInviteCode() : null;

    const result = await db.transaction(async (tx) => {
      // 1. Cek apakah ditautkan ke rekening penampung khusus
      let linkedAcc: typeof accounts.$inferSelect | null = null;
      if (validated.linkedAccountId) {
        const [acc] = await tx
          .select()
          .from(accounts)
          .where(and(eq(accounts.id, validated.linkedAccountId), eq(accounts.userId, userId)))
          .limit(1);
        if (acc) linkedAcc = acc;
      }

      // Tentukan saldo awal:
      // Jika ditautkan ke rekening penampung:
      // gunakan initialAmount jika diisi > 0, atau otomatis seluruh saldo rekening penampung saat ini
      let initialAmt = 0;
      if (linkedAcc) {
        initialAmt =
          validated.initialAmount !== undefined && validated.initialAmount > 0
            ? validated.initialAmount
            : Math.max(0, Number(linkedAcc.currentBalance));
      } else {
        initialAmt = validated.initialAmount || 0;
      }

      // 2. Buat record target tabungan
      const [newGoal] = await tx
        .insert(savingsGoals)
        .values({
          userId,
          name: validated.name,
          targetAmount: validated.targetAmount,
          currentAmount: initialAmt,
          targetDate: validated.targetDate || null,
          color: validated.color,
          icon: validated.icon,
          isShared: validated.isShared,
          hasYield: validated.hasYield || false,
          yieldNote: validated.yieldNote || null,
          totalYieldEarned: 0,
          linkedAccountId: linkedAcc ? linkedAcc.id : null,
          inviteCode,
          status: "ACTIVE",
        })
        .returning();

      // 3. Daftarkan pembuat sebagai OWNER di savings_members
      await tx.insert(savingsMembers).values({
        savingsGoalId: newGoal.id,
        userId,
        role: "OWNER",
        linkedAccountId: linkedAcc ? linkedAcc.id : null,
      });

      // 4. Catat riwayat setoran awal
      if (linkedAcc && initialAmt > 0) {
        // Mode Rekening Penampung: Saldo rekening penampung TIDAK DIPOTONG
        await tx.insert(savingsTransactions).values({
          savingsGoalId: newGoal.id,
          userId,
          type: "DEPOSIT",
          amount: initialAmt,
          fromAccountId: null,
          toAccountId: linkedAcc.id,
          note: `Saldo tersimpan di rekening penampung: ${linkedAcc.name}`,
          date: new Date(),
        });
      } else if (!linkedAcc && initialAmt > 0) {
        // Mode Celengan Kas Harian: potong rekening sumber jika ada
        await tx.insert(savingsTransactions).values({
          savingsGoalId: newGoal.id,
          userId,
          type: "DEPOSIT",
          amount: initialAmt,
          fromAccountId: validated.initialAccountId || null,
          note: "Setoran awal tabungan",
          date: new Date(),
        });

        if (validated.initialAccountId) {
          const [acc] = await tx
            .select()
            .from(accounts)
            .where(eq(accounts.id, validated.initialAccountId))
            .limit(1);

          if (acc) {
            await tx
              .update(accounts)
              .set({
                currentBalance: sql`${accounts.currentBalance} - ${initialAmt}`,
              })
              .where(eq(accounts.id, validated.initialAccountId));

            let [savingsCat] = await tx
              .select()
              .from(categories)
              .where(eq(categories.name, "Tabungan"))
              .limit(1);

            if (!savingsCat) {
              const [createdCat] = await tx
                .insert(categories)
                .values({
                  userId,
                  name: "Tabungan",
                  type: "EXPENSE",
                  color: "#09090B",
                  icon: "PiggyBank",
                  isSystem: true,
                })
                .returning();
              savingsCat = createdCat;
            }

            await tx.insert(transactions).values({
              userId,
              type: "EXPENSE",
              amount: initialAmt,
              date: new Date(),
              note: `Setoran awal tabungan: ${validated.name}`,
              accountId: validated.initialAccountId,
              categoryId: savingsCat?.id || null,
              excludeFromStats: true,
            });
          }
        }
      }

      return newGoal;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error("POST savings error:", error);
    const message = error instanceof Error ? error.message : "Gagal membuat target tabungan";
    return NextResponse.json({ message }, { status: 400 });
  }
}


import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/current-user";
import { processDueRecurringTransactions } from "@/lib/recurring-processor";

export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });
  }

  try {
    const result = await processDueRecurringTransactions(userId);

    return NextResponse.json({
      success: true,
      processedCount: result.processedCount,
      message:
        result.processedCount > 0
          ? `${result.processedCount} transaksi berulang berhasil diproses dan dicatat.`
          : "Semua jadwal transaksi sudah mutakhir, belum ada yang jatuh tempo.",
    });
  } catch (error: unknown) {
    console.error("POST /api/recurring/process error:", error);
    const message =
      error instanceof Error ? error.message : "Gagal memproses jadwal transaksi berulang";
    return NextResponse.json({ message }, { status: 500 });
  }
}


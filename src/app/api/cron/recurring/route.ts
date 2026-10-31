import { NextRequest, NextResponse } from "next/server";
import { processDueRecurringTransactions } from "@/lib/recurring-processor";

export async function GET(req: NextRequest) {
  // Verifikasi otorisasi Vercel Cron Secret (jika disetel di environment)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ message: "Tidak memiliki otorisasi" }, { status: 401 });
    }
  }

  try {
    const result = await processDueRecurringTransactions();

    return NextResponse.json({
      success: true,
      processedCount: result.processedCount,
      message: `${result.processedCount} transaksi berulang berhasil diproses.`,
    });
  } catch (error: unknown) {
    console.error("Vercel Cron recurring error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan saat memproses cron transaksi berulang";
    return NextResponse.json({ message }, { status: 500 });
  }
}

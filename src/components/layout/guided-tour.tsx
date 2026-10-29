"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Check, X, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TourStep {
  desktopSelector: string;
  mobileSelector: string;
  title: string;
  description: string;
  actionHint: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    desktopSelector: "#tour-accounts",
    mobileSelector: "#tour-accounts-mobile",
    title: "Langkah 1: Rekening Keuangan",
    description:
      "Wadah utama untuk menyimpan saldo Anda (seperti Rekening Bank, Dompet Tunai, atau E-Wallet). Mulailah pencatatan dengan membuat rekening pertama Anda di menu ini.",
    actionHint: "Menu Rekening",
  },
  {
    desktopSelector: "#tour-quick-entry",
    mobileSelector: "#tour-quick-mobile",
    title: "Langkah 2: Catat Transaksi Cepat",
    description:
      "Tekan tombol tambah (+) ini kapan saja untuk mencatat pengeluaran harian, pemasukan baru, atau transfer saldo antar rekening secara cepat dan praktis.",
    actionHint: "Tombol Catat Cepat",
  },
  {
    desktopSelector: "#tour-dashboard",
    mobileSelector: "#tour-dashboard-mobile",
    title: "Langkah 3: Dashboard & Arus Kas",
    description:
      "Pusat kendali keuangan Anda: memantau total saldo gabungan, arus kas pemasukan dan pengeluaran bulanan, grafik tren, serta pos belanja terbesar.",
    actionHint: "Menu Dashboard",
  },
  {
    desktopSelector: "#tour-transactions",
    mobileSelector: "#tour-transactions-mobile",
    title: "Langkah 4: Riwayat Transaksi Harian",
    description:
      "Pantau mutasi keuangan yang dikelompokkan rapi per tanggal, lengkap dengan subtotal pengeluaran harian dan filter pencarian transaksi.",
    actionHint: "Menu Transaksi",
  },
  {
    desktopSelector: "#tour-recurring",
    mobileSelector: "#tour-recurring-mobile",
    title: "Langkah 5: Transaksi Berulang",
    description:
      "Otomatiskan pencatatan transaksi rutin yang berulang secara berkala (seperti tagihan listrik, langganan internet bulanan, atau penerimaan gaji).",
    actionHint: "Menu Berulang",
  },
  {
    desktopSelector: "#tour-debts",
    mobileSelector: "#tour-debts-mobile",
    title: "Langkah 6: Hutang & Piutang",
    description:
      "Catat pinjaman uang Anda ke pihak lain maupun piutang orang lain kepada Anda, lengkap dengan jatuh tempo dan riwayat cicilan pelunasan.",
    actionHint: "Menu Hutang Piutang",
  },
  {
    desktopSelector: "#tour-categories",
    mobileSelector: "#tour-categories-mobile",
    title: "Langkah 7: Pos Kategori",
    description:
      "Kelola dan kelompokkan pos pengeluaran serta pemasukan sesuai kebutuhan Anda, lengkap dengan pilihan warna dan ikon visual yang rapi.",
    actionHint: "Menu Kategori",
  },
  {
    desktopSelector: "#tour-driver-mode",
    mobileSelector: "#tour-driver-mode-mobile",
    title: "Langkah 8: Fitur Khusus Ojol / COD",
    description:
      "Fitur terbaru untuk driver ojol (Shopee, Gojek, Grab, Maxim). Aktifkan toggle Mode Ojol untuk pencatatan orderan COD dalam 1 klik dengan mutasi saldo otomatis.",
    actionHint: "Mode Ojol & COD",
  },
];

const STORAGE_KEY = "pantauuang_guided_tour_completed";

interface GuidedTourProps {
  forceOpen?: boolean;
  onClose?: () => void;
  onMobileSheetChange?: (open: boolean) => void;
  onTourActiveChange?: (active: boolean) => void;
}

export function GuidedTour({
  forceOpen = false,
  onClose,
  onMobileSheetChange,
  onTourActiveChange,
}: GuidedTourProps) {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = React.useState<number>(0);
  const [targetRect, setTargetRect] = React.useState<DOMRect | null>(null);

  // Sinkronisasi forceOpen saat prop berubah selama render
  const [prevForceOpen, setPrevForceOpen] = React.useState(forceOpen);
  if (prevForceOpen !== forceOpen) {
    setPrevForceOpen(forceOpen);
    if (forceOpen) {
      setCurrentStepIndex(0);
      setIsOpen(true);
    }
  }

  // Gunakan ref untuk callback agar tidak memicu eksekusi effect yang tidak diinginkan
  const onTourActiveChangeRef = React.useRef(onTourActiveChange);
  onTourActiveChangeRef.current = onTourActiveChange;

  const onMobileSheetChangeRef = React.useRef(onMobileSheetChange);
  onMobileSheetChangeRef.current = onMobileSheetChange;

  // Notifikasi status aktif tur ke parent (hanya saat isOpen berubah)
  React.useEffect(() => {
    onTourActiveChangeRef.current?.(isOpen);
  }, [isOpen]);

  // Pantau transisi isOpen: jika tour sebelumnya aktif lalu ditutup, pastikan sheet mobile ditutup
  const prevIsOpenRef = React.useRef(isOpen);
  React.useEffect(() => {
    if (prevIsOpenRef.current && !isOpen) {
      onMobileSheetChangeRef.current?.(false);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  // Buka sheet Menu Lainnya secara otomatis di mobile untuk langkah 5 s/d 8 HANYA saat tour aktif
  React.useEffect(() => {
    if (!isOpen) return;

    const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
    if (isMobile) {
      // Langkah index 4..7 (Langkah 5 s/d 8) berada di dalam Menu Lainnya
      const shouldOpenSheet = currentStepIndex >= 4;
      onMobileSheetChangeRef.current?.(shouldOpenSheet);
    } else {
      onMobileSheetChangeRef.current?.(false);
    }
  }, [isOpen, currentStepIndex]);

  // Periksa status kunjungan pertama pengguna (hanya saat mount awal)
  React.useEffect(() => {
    const isCompleted = localStorage.getItem(STORAGE_KEY) === "true";
    if (!isCompleted) {
      // Berikan jeda 700ms agar layout selesai render sebelum tour dimulai
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  // Update posisi spotlight saat step berubah atau window resize/scroll
  const updateTargetPosition = React.useCallback(() => {
    if (!isOpen) return;

    const isDesktop = window.innerWidth >= 1024;
    const currentStep = TOUR_STEPS[currentStepIndex];
    const selector = isDesktop ? currentStep.desktopSelector : currentStep.mobileSelector;
    let element = document.querySelector(selector);

    // Fallback jika elemen di dalam sheet mobile belum selesai ter-render
    if (!element && !isDesktop && currentStepIndex >= 4) {
      element = document.querySelector("#tour-more-mobile");
    }

    if (element) {
      if (typeof element.scrollIntoView === "function") {
        element.scrollIntoView({ block: "nearest", behavior: "instant" });
      }
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [isOpen, currentStepIndex]);

  React.useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      updateTargetPosition();
    });

    // Jeda tambahan untuk menunggu transisi buka/tutup sheet selesai di mobile
    const timer = setTimeout(() => {
      updateTargetPosition();
    }, 120);

    const handleResizeOrScroll = () => {
      updateTargetPosition();
    };

    window.addEventListener("resize", handleResizeOrScroll);
    window.addEventListener("scroll", handleResizeOrScroll, true);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
      window.removeEventListener("resize", handleResizeOrScroll);
      window.removeEventListener("scroll", handleResizeOrScroll, true);
    };
  }, [updateTargetPosition, currentStepIndex]);

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsOpen(false);
    onClose?.();
  };

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  // Hitung posisi popover kartu panduan secara dinamis
  const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1024;
  let popoverStyle: React.CSSProperties = {};
  let targetLocationHint = "";

  if (targetRect) {
    if (isDesktop) {
      // Di desktop (sidebar di kiri), tampilkan popover di sebelah kanan target
      popoverStyle = {
        left: `${Math.min(targetRect.right + 20, window.innerWidth - 340)}px`,
        top: `${Math.max(20, Math.min(targetRect.top - 20, window.innerHeight - 260))}px`,
        width: "320px",
      };
    } else {
      // Di mobile:
      // Karena target menu berada di bilah navigasi bawah (bottom-nav),
      // posisikan kartu di bagian ATAS layar agar tidak menutupi menu yang disorot!
      const isTargetInBottomHalf = targetRect.top > window.innerHeight / 2;
      if (isTargetInBottomHalf) {
        popoverStyle = {
          left: "16px",
          right: "16px",
          top: "16px",
          maxWidth: "400px",
          margin: "0 auto",
        };
        targetLocationHint = "Lihat sorotan menu di bawah ↓";
      } else {
        popoverStyle = {
          left: "16px",
          right: "16px",
          bottom: "80px",
          maxWidth: "400px",
          margin: "0 auto",
        };
        targetLocationHint = "Lihat sorotan menu di atas ↑";
      }
    }
  } else {
    // Fallback jika elemen belum selesai render
    popoverStyle = {
      left: "16px",
      right: "16px",
      top: "16px",
      maxWidth: "400px",
      margin: "0 auto",
    };
  }

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto select-none" role="dialog" aria-modal="true">
      {/* SVG Spotlight Mask Overlay */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none transition-all duration-300">
        <defs>
          <mask id="tour-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 6}
                y={targetRect.top - 6}
                width={targetRect.width + 12}
                height={targetRect.height + 12}
                rx="8"
                fill="black"
                className="transition-all duration-300 ease-in-out"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.65)"
          mask="url(#tour-spotlight-mask)"
          className="pointer-events-auto"
          onClick={handleNext}
        />
      </svg>

      {/* Animated Spotlight Border Box */}
      {targetRect && (
        <div
          className="fixed pointer-events-none border-2 border-white rounded-md transition-all duration-300 ease-in-out shadow-sm z-50"
          style={{
            left: `${targetRect.left - 6}px`,
            top: `${targetRect.top - 6}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
          }}
        >
          {/* Corner Number Badge (Solid tanpa animasi pulse) */}
          <span className="absolute -top-2.5 -right-2.5 h-5 w-5 rounded-full bg-zinc-950 text-white text-[10px] font-bold flex items-center justify-center border border-white">
            {currentStepIndex + 1}
          </span>
        </div>
      )}

      {/* Guided Card Popover */}
      <div
        className="fixed z-50 bg-white text-zinc-950 border border-zinc-900 rounded-md p-4 sm:p-5 shadow-none w-[calc(100vw-32px)] sm:w-80 transition-all duration-300 ease-in-out"
        style={popoverStyle}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 pb-2 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <span className="h-5 w-5 rounded bg-zinc-950 text-white flex items-center justify-center text-[10px] font-bold">
              <Compass className="h-3 w-3" />
            </span>
            <span className="text-xs font-semibold text-zinc-950 uppercase tracking-tight">
              Panduan Menu ({currentStepIndex + 1}/{TOUR_STEPS.length})
            </span>
          </div>

          <button
            onClick={handleComplete}
            className="p-1 rounded text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 transition-colors cursor-pointer"
            title="Lewati Panduan"
            aria-label="Lewati Panduan"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="pt-3">
          <h3 className="text-sm font-bold text-zinc-950 tracking-tight">
            {currentStep.title}
          </h3>
          <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed">
            {currentStep.description}
          </p>

          <div className="mt-2.5 flex items-center justify-between text-[11px] font-semibold text-zinc-800 bg-zinc-100 px-2.5 py-1.5 rounded">
            <span>Menu: {currentStep.actionHint}</span>
            {targetLocationHint && (
              <span className="text-zinc-600 font-medium">{targetLocationHint}</span>
            )}
          </div>
        </div>

        {/* Dots Step Indicator */}
        <div className="flex items-center justify-between pt-4 mt-3 border-t border-zinc-200">
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  idx === currentStepIndex
                    ? "w-4 bg-zinc-950"
                    : "w-1.5 bg-zinc-300"
                }`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                className="h-8 px-2.5 text-xs border-zinc-300 hover:bg-zinc-100 text-zinc-800"
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                <span>Balik</span>
              </Button>
            )}

            <Button
              size="sm"
              onClick={handleNext}
              className="h-8 px-3 text-xs bg-zinc-950 text-white hover:bg-zinc-800 flex items-center gap-1"
            >
              {isLastStep ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Selesai</span>
                </>
              ) : (
                <>
                  <span>Lanjut</span>
                  <ArrowRight className="h-3 w-3" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

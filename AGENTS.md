# AGENTS.MD - Panduan Pengembangan PantauUang

Dokumen ini adalah instruksi wajib bagi AI Coding Agent yang bertugas menulis, memodifikasi, atau memeriksa kode pada repositori **PantauUang**. Patuhi seluruh aturan di bawah ini tanpa pengecualian.

## 1. Konteks Proyek & Tech Stack
* **Nama Aplikasi:** PantauUang (Aplikasi pencatatan keuangan pribadi).
* **Framework:** Next.js (App Router) dengan TypeScript ketat (`strict: true`).
* **Database & ORM:** Neon Serverless Postgres + Drizzle ORM.
* **State & Fetching:** TanStack Query v5.
* **Autentikasi:** Auth.js v5 (NextAuth) khusus Google OAuth.
* **Styling:** Tailwind CSS + shadcn/ui + Lucide React.

## 2. Aturan Ketat Desain & Anti-AI Slop (WAJIB)
Saat membuat komponen UI atau halaman frontend, Anda dilarang menghasilkan pola desain klise AI:
1. **DILARANG menggunakan gradasi warna:** Jangan pernah menulis class seperti `bg-gradient-to-*`, `from-*`, `via-*`, atau `to-*`. Gunakan warna solid.
2. **DILARANG membuat Eyebrow Text:** Jangan menambahkan teks kecil berhuruf kapital di atas judul utama.
3. **DILARANG menggunakan animasi Pulse untuk dekorasi:** Jangan gunakan `animate-pulse` kecuali pada komponen `Skeleton` saat data sedang dimuat.
4. **DILARANG menggunakan karakter Em Dash:** Jangan pernah menggunakan karakter em dash di seluruh teks antarmuka, komentar kode, pesan error, maupun dokumentasi. Gunakan tanda hubung biasa (`-`), titik dua (`:`), atau koma (`,`).
5. **Tema Hitam Putih Elegan:**
   * Gunakan latar putih (`bg-white`), teks hitam (`text-zinc-950`), dan border tipis (`border border-zinc-200` atau `border-zinc-900` untuk elemen aktif).
   * Gunakan `shadow-none` pada semua komponen `Card`, `Button`, dan `Input`.
   * Sudut komponen harus tegas: gunakan `rounded-none` atau maksimal `rounded-md` (`6px`). Jangan gunakan `rounded-2xl` atau `rounded-3xl`.
6. **Tipografi Angka:** Setiap elemen HTML yang menampilkan nominal uang atau angka statistik wajib memiliki class `tabular-nums`.
7. **Copywriting Ringkas:** Gunakan Bahasa Indonesia yang lugas, pendek, dan profesional. Jangan tambahkan teks motivasi, sapaan panjang, atau emoji yang tidak perlu.
8. **DILARANG menggunakan Left Accent Border / Colored Border Strip:** Jangan pernah menggunakan garis tepi tebal berwarna di sisi kiri, atas, bawah, atau kanan komponen Card (seperti class Tailwind `border-l-4`, `border-l-8`, `border-t-4`, atau elemen `div` vertikal tipis sebagai indikator warna di pinggir card).
9. **Konsistensi Border Card:** Semua Card wajib memiliki ketebalan dan warna border yang seragam di keempat sisinya (`border border-neutral-900` atau `border border-zinc-200` dengan ketebalan `1px` merata).
10. **Cara Menampilkan Warna/Identitas Rekening:** Terapkan warna secara halus pada ikon/badge, BUKAN pada border card.

## 3. Aturan Logika Bisnis Keuangan
1. **Tipe Data Uang:** Seluruh nominal uang di database dan API menggunakan bilangan bulat (`number` / `bigint` dalam Rupiah penuh). Jangan gunakan bilangan desimal (`float`).
2. **Pemisahan Tipe Transaksi:**
   * Terdapat 3 tipe: `'INCOME'`, `'EXPENSE'`, dan `'TRANSFER'`.
   * Kalkulasi laporan Pemasukan dan Pengeluaran bulanan di Dashboard **wajib mengecualikan** transaksi bertipe `'TRANSFER'`.
3. **Penanganan Transfer & Biaya Admin:**
   * Segala proses pembuatan, pengubahan, atau penghapusan transaksi harus dijalankan di dalam `db.transaction()` (transaksi database atomik).
   * Jika pengguna menginput Transfer dengan Biaya Admin lebih dari 0:
     * Buat 1 record `'TRANSFER'` dengan nominal transfer.
     * Buat 1 record `'EXPENSE'` terpisah untuk biaya admin yang memiliki `parent_transfer_id` mengarah ke ID record transfer tadi.
     * Kurangi saldo rekening asal sebesar `nominal transfer + biaya admin`.
     * Tambahkan saldo rekening tujuan sebesar `nominal transfer`.
4. **Visibilitas Total Saldo:**
   * Saat menghitung "Total Saldo Gabungan" untuk Dashboard, filter hanya rekening yang memiliki atribut `exclude_from_total === false`.

## 4. Standar Penulisan Kode (Coding Conventions)
* **TanStack Query Keys:** Gunakan struktur array yang konsisten di dalam folder `src/hooks/`:
  * `['accounts']` untuk daftar rekening.
  * `['transactions', filterParams]` untuk daftar transaksi.
  * `['dashboard-summary', month, year]` untuk ringkasan dashboard.
  * Setiap `useMutation` (tambah/ubah/hapus transaksi atau rekening) wajib melakukan `queryClient.invalidateQueries` pada ketiga key di atas.
* **Validasi Input:** Semua endpoint API atau Server Actions wajib memvalidasi payload menggunakan skema `Zod` sebelum menyentuh database, serta memvalidasi `session.user.id` dari Auth.js.
* **Responsivitas:** Pastikan setiap halaman dan tabel diuji untuk ukuran layar `375px` (Mobile) hingga `1440px` (Desktop). Gunakan pola responsif Tailwind (`md:`, `lg:`) dan hindari horizontal scroll yang tidak disengaja pada layar ponsel.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

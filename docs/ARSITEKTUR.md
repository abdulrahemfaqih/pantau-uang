# Arsitektur Sistem & Database: PantauUang

## 1. Tech Stack Utama
* **Framework:** Next.js (App Router, TypeScript)
* **Client State & Data Fetching:** TanStack Query v5
* **Database:** Neon Serverless Postgres
* **ORM:** Drizzle ORM (direkomendasikan karena ringan dan sangat cepat di lingkungan serverless Neon)
* **Autentikasi:** Auth.js v5 (NextAuth) dengan provider Google OAuth
* **UI & Styling:** Tailwind CSS + shadcn/ui + Lucide Icons
* **Grafik:** Recharts (melalui komponen shadcn/ui charts)
* **Validasi Data:** Zod + React Hook Form

## 2. Arsitektur Alur Data (Next.js + TanStack Query)
1. **Server Components (RSC):** Digunakan pada level halaman (`page.tsx`) untuk memverifikasi sesi pengguna dan melakukan *prefetching* data awal bila diperlukan.
2. **API Routes / Server Actions:** Seluruh operasi baca/tulis ke Neon DB melewati fungsi server yang dilindungi oleh pengecekan sesi Auth.js.
3. **TanStack Query (Client Side):**
   * Mengelola cache di sisi klien untuk filter dinamis, pencarian transaksi, dan paginasi tanpa memuat ulang halaman.
   * Melakukan invalidasi query otomatis setelah mutasi data. Contoh: Saat menambah transaksi baru, query `['transactions']`, `['accounts']`, dan `['dashboard-summary']` langsung di-invalidate secara paralel agar angka di layar langsung diperbarui.

## 3. Skema Database (PostgreSQL / Drizzle ORM)

Semua nilai uang disimpan menggunakan tipe data `BIGINT` (atau `NUMERIC(15, 0)`) dalam satuan Rupiah penuh untuk menghindari kesalahan pembulatan desimal (floating-point error).

### 3.1. Tabel `users` (Dikelola bersama Auth.js)
* `id`: TEXT / UUID (Primary Key)
* `name`: TEXT (Not Null)
* `email`: TEXT (Unique, Not Null)
* `image`: TEXT
* `created_at`: TIMESTAMP (Default Now)

### 3.2. Tabel `accounts` (Rekening)
* `id`: UUID (Primary Key)
* `user_id`: TEXT (Foreign Key ke `users.id`, On Delete Cascade)
* `name`: TEXT (Not Null, contoh: "BCA Utama", "GoPay")
* `type`: VARCHAR(20) (Not Null: `BANK`, `EWALLET`, `CASH`, `CREDIT_CARD`)
* `initial_balance`: BIGINT (Not Null, Default 0)
* `current_balance`: BIGINT (Not Null, Default 0)
* `color`: VARCHAR(20) (Not Null, kode hex warna teredam)
* `icon`: VARCHAR(50) (Not Null, nama ikon Lucide)
* `exclude_from_total`: BOOLEAN (Not Null, Default false)
* `created_at`: TIMESTAMP (Default Now)

### 3.3. Tabel `categories` (Kategori)
* `id`: UUID (Primary Key)
* `user_id`: TEXT (Foreign Key ke `users.id`, On Delete Cascade)
* `name`: TEXT (Not Null, contoh: "Makan", "Bensin", "Gaji")
* `type`: VARCHAR(20) (Not Null: `INCOME`, `EXPENSE`)
* `color`: VARCHAR(20) (Not Null)
* `icon`: VARCHAR(50) (Not Null)
* `is_system`: BOOLEAN (Default false, penanda untuk kategori khusus seperti "Biaya Admin")

### 3.4. Tabel `transactions` (Transaksi)
* `id`: UUID (Primary Key)
* `user_id`: TEXT (Foreign Key ke `users.id`, On Delete Cascade)
* `type`: VARCHAR(20) (Not Null: `INCOME`, `EXPENSE`, `TRANSFER`)
* `amount`: BIGINT (Not Null, harus lebih besar dari 0)
* `date`: TIMESTAMP WITH TIME ZONE (Not Null)
* `note`: TEXT (Nullable)
* `account_id`: UUID (Foreign Key ke `accounts.id`, rekening sumber/utama)
* `to_account_id`: UUID (Nullable, Foreign Key ke `accounts.id`, khusus untuk `TRANSFER`)
* `category_id`: UUID (Nullable, Foreign Key ke `categories.id`, kosong jika `TRANSFER`)
* `parent_transfer_id`: UUID (Nullable, Self-reference ke `transactions.id` untuk mengikat transaksi Biaya Admin ke transaksi Transfer induknya)
* `created_at`: TIMESTAMP (Default Now)

*Index Database yang Wajib Dibuat:*
* `idx_transactions_user_date` pada `(user_id, date DESC)` untuk mempercepat loading dashboard dan filter tanggal.
* `idx_transactions_user_type` pada `(user_id, type)`.

## 4. Logika Atomik: Transfer & Biaya Admin
Saat pengguna melakukan transfer dari Rekening A ke Rekening B sebesar `X` dengan biaya admin `Y` (di mana `Y > 0`), database wajib menjalankan `db.transaction()` sebagai berikut:

1. **Insert Transaksi Transfer:**
   * `type`: `'TRANSFER'`
   * `amount`: `X`
   * `account_id`: Rekening A
   * `to_account_id`: Rekening B
   * Simpan ID transaksi ini sebagai `transferId`.
2. **Insert Transaksi Biaya Admin (Jika Y > 0):**
   * `type`: `'EXPENSE'`
   * `amount`: `Y`
   * `account_id`: Rekening A
   * `category_id`: ID Kategori "Biaya Admin"
   * `parent_transfer_id`: `transferId`
   * `note`: `"Biaya admin transfer ke [Nama Rekening B]"`
3. **Update Saldo Rekening A:**
   * `current_balance = current_balance - (X + Y)`
4. **Update Saldo Rekening B:**
   * `current_balance = current_balance + X`

*Catatan Penghapusan:* Jika pengguna menghapus transaksi transfer induk, sistem memeriksa apakah ada transaksi dengan `parent_transfer_id` yang merujuk ke transaksi tersebut. Jika ada, transaksi biaya admin ikut dihapus dan seluruh saldo (`X + Y` ke Rekening A, `-X` dari Rekening B) dikembalikan secara utuh.

## 5. Struktur Folder Proyek
```text
src/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx               # Dashboard Utama
│   │   ├── transactions/page.tsx  # Riwayat, Pencarian & Filter
│   │   ├── accounts/page.tsx      # Manajemen Rekening
│   │   └── categories/page.tsx    # Manajemen Kategori
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── accounts/route.ts
│       ├── transactions/route.ts
│       └── analytics/route.ts
├── components/
│   ├── ui/                        # Komponen dasar shadcn/ui
│   ├── layout/                    # Sidebar (Desktop) & Bottom Nav (Mobile)
│   ├── forms/                     # Form Transaksi, Transfer, Rekening
│   └── dashboard/                 # Kartu Ringkasan & Grafik Recharts
├── db/
│   ├── index.ts                   # Koneksi Neon Serverless
│   └── schema.ts                  # Definisi tabel Drizzle
├── hooks/                         # Custom hooks TanStack Query (useTransactions, dll)
└── lib/
    ├── auth.ts                    # Konfigurasi Auth.js
    ├── utils.ts                   # Formatter Rupiah & helper class Tailwind
    └── validations.ts             # Skema Zod
```
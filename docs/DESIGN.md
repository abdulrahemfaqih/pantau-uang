# Sistem Desain & Panduan UX: PantauUang

## 1. Filosofi Visual
PantauUang mengusung gaya **Editorial Monochrome / Architectural Grid**. Fokus utamanya adalah keterbacaan angka, kejelasan batas antar elemen menggunakan garis tipis (hairline borders), dan ketiadaan ornamen visual yang tidak memiliki fungsi.

### Daftar Larangan Visual (Anti-AI Slop)
* **Dilarang menggunakan warna gradasi (gradients):** Semua latar belakang, tombol, dan kartu harus menggunakan warna solid.
* **Dilarang menggunakan Eyebrow Text:** Jangan pernah menaruh teks kecil berhuruf kapital di atas judul halaman (contoh yang dilarang: `RINGKASAN KEUANGAN ANDA` di atas judul `Dashboard`).
* **Dilarang menggunakan efek Pulse / Glow:** Gunakan kerangka abu-abu statis untuk indikator pemuatan (loading state), bukan efek berkedip yang mencolok.
* **Dilarang menggunakan bayangan tebal (Heavy Shadows):** Gunakan `shadow-none`. Pemisahan elemen murni mengandalkan border hitam/abu-abu tipis (`1px solid`).
* **Dilarang menggunakan copywriting berlebihan:** Hindari kalimat sapaan panjang seperti "Selamat pagi Budi! Siap mengelola masa depan finansialmu hari ini?". Cukup tampilkan judul halaman "Dashboard" dan bulan aktif.

## 2. Palet Warna
Palet dasar adalah hitam dan putih murni, dipadukan dengan warna aksen yang diredam (desaturated/muted) khusus untuk indikator data dan identitas rekening.

### Warna Dasar
* **Background Utama:** `#FFFFFF` (Putih Murni)
* **Background Sekunder (Hover / Area Pasif):** `#FAFAFA` (Zinc 50)
* **Teks Utama:** `#09090B` (Zinc 950 / Hitam Pekat)
* **Teks Sekunder (Label / Tanggal):** `#71717A` (Zinc 500)
* **Border Utama (Kartu & Tabel):** `#E4E4E7` (Zinc 200)
* **Border Aktif / Fokus / Penekanan:** `#09090B` (Hitam `1px solid`)
* **Tombol Utama (Primary CTA):** Latar `#09090B`, Teks `#FFFFFF`, Hover `#27272A`

### Warna Semantik Teredam (Muted Semantic Colors)
Digunakan secara hemat hanya pada teks nominal, badge tipe transaksi, dan grafik:
* **Pemasukan (Income):** Hijau Hutan Teredam `#15803D` (Teks), `#F0FDF4` (Latar Badge)
* **Pengeluaran (Expense):** Merah Bata Teredam `#B91C1C` (Teks), `#FEF2F2` (Latar Badge)
* **Transfer:** Biru Batu Teredam `#1D4ED8` (Teks), `#EFF6FF` (Latar Badge)

### Warna Identitas Rekening (Muted Account Accents)
Untuk membedakan rekening tanpa merusak tema hitam putih, warna hanya ditampilkan sebagai titik kecil (`8px x 8px` lingkaran) atau border kiri tipis (`3px`) pada kartu rekening:
* Slate (`#475569`), Stone (`#57534E`), Amber Redup (`#B45309`), Emerald Redup (`#047857`), Indigo Redup (`#4338CA`), Rose Redup (`#BE123C`).

## 3. Tipografi & Format Angka
* **Font Utama (UI & Teks):** `Inter` atau `Geist Sans`.
* **Font Angka (Nominal & Tabel):** Wajib menerapkan class `tabular-nums` (atau menggunakan `Geist Mono`) pada seluruh nominal uang dan tanggal agar posisi digit sejajar lurus secara vertikal di dalam daftar maupun tabel.
* **Format Mata Uang:** `Rp 1.250.000` (tanpa `,00` di belakang untuk menjaga kebersihan visual).

## 4. Tata Letak & Responsivitas (UX)

### 4.1. Navigasi Adaptif
* **Desktop (`>= 1024px`):**
  * Sidebar kiri tetap (lebar `240px`) dengan border kanan `1px solid #E4E4E7`.
  * Berisi 4 menu: Dashboard, Transaksi, Rekening, Kategori, serta tombol aksi utama `+ Catat Transaksi` di bagian atas sidebar.
* **Mobile & Tablet (`< 1024px`):**
  * Sidebar disembunyikan, digantikan oleh **Bottom Navigation Bar** tetap di bagian bawah layar dengan border atas `1px solid #09090B`.
  * Berisi 4 menu ikon + 1 tombol tengah yang menonjol (hitam solid) untuk `+ Catat` agar mudah dijangkau ibu jari.

### 4.2. Desain Modal Input Cepat (Quick Entry UX)
Agar pengguna tidak pusing saat mencatat transaksi, form input dirancang menggunakan satu kotak dialog (Modal di Desktop, Bottom Sheet/Drawer di Mobile) dengan struktur berikut:
1. **Tab Switcher di Bagian Atas:** Tiga pilihan tegas: `Pengeluaran` | `Pemasukan` | `Transfer`.
2. **Input Nominal Besar:** Berada tepat di bawah tab, ukuran font besar (`text-3xl font-semibold tabular-nums`), langsung aktif (autofocus) saat modal dibuka.
3. **Susunan Field Dinamis:**
   * Jika tab **Pengeluaran / Pemasukan** aktif:
     * Baris 1: Pilih Rekening & Pilih Kategori (bersebelahan 2 kolom).
     * Baris 2: Tanggal (default Hari Ini) & Catatan singkat.
   * Jika tab **Transfer** aktif:
     * Baris 1: Dari Rekening (Asal) -> Ke Rekening (Tujuan).
     * Baris 2: Kolom **Biaya Admin (Opsional)** dengan teks bantuan kecil di bawahnya: *"Otomatis dicatat sebagai pengeluaran terpisah jika diisi"*.
     * Baris 3: Tanggal & Catatan singkat.
4. **Tombol Simpan:** Lebar penuh (`w-full`), latar hitam solid.

### 4.3. Struktur Halaman Dashboard
Menggunakan sistem Bento Grid dengan border tipis dan jarak antar kotak yang rapi (`gap-4`):
* **Baris 1 (3 Kolom di Desktop, 1 Kolom di Mobile):**
  * Kartu 1: Total Saldo Gabungan (disertai indikator kecil jumlah rekening yang disembunyikan, misal: *"1 rekening disembunyikan"*).
  * Kartu 2: Pemasukan Bulan Ini.
  * Kartu 3: Pengeluaran Bulan Ini.
* **Baris 2 (2 Kolom di Desktop, Tumpuk di Mobile):**
  * Kolom Kiri (Lebar 60%): Grafik Tren Bulanan (Bar Chart hitam untuk pemasukan, abu-abu tua untuk pengeluaran).
  * Kolom Kanan (Lebar 40%): Pengeluaran per Kategori (Daftar kategori dengan progress bar tipis di bawah tiap nama kategori dan persentasenya).
* **Baris 3:**
  * Tabel Transaksi Terbaru (5 baris terakhir) + Daftar Rekening ringkas di sebelahnya.

### 4.4. Halaman Riwayat & Filter Transaksi
* **Baris Kontrol Filter:** Terletak di atas tabel, terdiri dari:
  * Input pencarian teks (Catatan).
  * Dropdown Rentang Tanggal.
  * Dropdown Rekening.
  * Dropdown Kategori.
  * Popover Rentang Nominal (Min - Max).
  * Tombol `Reset` (hanya muncul jika ada filter yang aktif).
* **Tampilan Daftar Transaksi:**
  * **Desktop:** Tabel penuh dengan kolom Tanggal, Kategori/Tipe, Catatan, Rekening, dan Nominal (rata kanan).
  * **Mobile:** Kartu baris tunggal yang ringkas. Kiri: Ikon + Nama Kategori & Nama Rekening di bawahnya. Kanan: Nominal (`tabular-nums`) & Tanggal kecil di bawahnya.
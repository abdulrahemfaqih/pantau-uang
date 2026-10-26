# Product Requirements Document (PRD): PantauUang

## 1. Ringkasan Produk
* **Nama Produk:** PantauUang
* **Visi Produk:** Aplikasi web pencatatan keuangan pribadi yang cepat, bersih, dan fungsional dengan pendekatan desain monokrom (hitam putih) yang elegan tanpa distraksi visual.
* **Target Pengguna:** Individu yang membutuhkan pencatatan arus kas harian multi-rekening (bank, e-wallet, tunai, kartu kredit) dengan antarmuka yang langsung pada intinya.

## 2. Prinsip Utama Produk
1. **Zero AI Slop:** Tidak ada kalimat basa-basi, tidak ada warna gradasi, tidak ada teks dekoratif di atas judul (eyebrow text), dan tidak ada animasi berdenyut (pulse) yang mengganggu.
2. **Kecepatan Input:** Mencatat transaksi harus selesai dalam waktu kurang dari 10 detik.
3. **Akurasi Akuntansi Pribadi:** Pemisahan tegas antara pemasukan, pengeluaran, dan transfer antar rekening agar laporan bulanan tidak mengalami pembengkakan semu.
4. **Responsif Penuh:** Pengalaman pengguna yang setara baik di layar ponsel (Mobile) maupun komputer (Desktop).

## 3. Spesifikasi Fitur Utama (Scope MVP)

### 3.1. Autentikasi Pengguna
* Masuk dan daftar hanya menggunakan satu tombol: **Google OAuth**.
* Pembuatan kategori bawaan (default categories) otomatis saat pengguna pertama kali mendaftar.

### 3.2. Manajemen Rekening (Accounts)
* **Tipe Rekening:**
  * `BANK` (Contoh: BCA, Mandiri, BRI, Jago)
  * `EWALLET` (Contoh: GoPay, OVO, DANA, ShopeePay)
  * `CASH` (Dompet Tunai)
  * `CREDIT_CARD` (Kartu Kredit)
* **Atribut Rekening:** Nama rekening, tipe, saldo awal, saldo saat ini, ikon penanda, warna aksen teredam (muted color), dan status visibilitas total.
* **Sembunyikan dari Total:** Opsi boolean (`exclude_from_total`) pada tiap rekening. Jika aktif (misal untuk rekening Dana Darurat atau Tabungan Investasi), saldo rekening tetap tampil di daftar rekening tetapi tidak dijumlahkan ke dalam "Total Saldo Gabungan" di Dashboard.

### 3.3. Pencatatan Pemasukan & Pengeluaran (Transactions)
* **Input Cepat (Quick Entry):**
  * **Nominal:** Input angka dengan pemisah ribuan otomatis (format Rupiah).
  * **Tipe:** Pemasukan (`INCOME`) atau Pengeluaran (`EXPENSE`).
  * **Kategori:** Pilihan kategori yang sesuai dengan tipe transaksi.
  * **Rekening:** Pilihan rekening yang digunakan.
  * **Tanggal:** Default ke hari ini, dapat diubah melalui pemilih tanggal (date picker).
  * **Catatan:** Teks opsional singkat.
* **Manajemen Kategori:**
  * Pengguna dapat menambah, mengubah nama, atau menghapus kategori kustom.
  * Kategori bawaan untuk Pengeluaran: Makan & Minum, Transportasi/Bensin, Tagihan, Belanja, Biaya Admin.
  * Kategori bawaan untuk Pemasukan: Gaji, Proyek Freelance, Bonus, Lainnya.
* **Pencarian & Filter:**
  * Pencarian berbasis teks pada kolom catatan.
  * Filter berdasarkan rentang tanggal (Bulan ini, Bulan lalu, Kustom).
  * Filter berdasarkan Kategori, Rekening, dan rentang Nominal (Minimum dan Maksimum).

### 3.4. Transfer Antar Rekening (Transfers)
* **Karakteristik Transaksi:** Dicatat sebagai tipe `TRANSFER` agar tidak dihitung sebagai pemasukan atau pengeluaran pada grafik laporan bulanan.
* **Mekanisme Saldo:** Saldo rekening asal (`account_id`) otomatis berkurang, dan saldo rekening tujuan (`to_account_id`) otomatis bertambah sebesar nominal transfer.
* **Penanganan Biaya Admin (Admin Fee):**
  * Form transfer memiliki kolom opsional "Biaya Admin" (default Rp0).
  * Jika Biaya Admin diisi lebih dari Rp0 (contoh: transfer BCA ke DANA kena Rp1.000), sistem secara otomatis bekerja dalam satu transaksi database (atomic transaction):
    1. Mengurangi rekening asal sebesar `Nominal Transfer + Biaya Admin`.
    2. Menambah rekening tujuan sebesar `Nominal Transfer`.
    3. Membuat satu catatan transaksi terpisah bertipe `EXPENSE` dengan kategori "Biaya Admin" senilai Rp1.000 yang terhubung dengan transaksi transfer tersebut.

### 3.5. Dashboard & Analitik
* **Ringkasan Utama:**
  * Total Saldo Gabungan (hanya dari rekening yang tidak disembunyikan).
  * Total Pemasukan Bulan Ini.
  * Total Pengeluaran Bulan Ini.
  * Selisih Arus Kas (Net Cashflow) Bulan Ini.
* **Visualisasi Data:**
  * **Grafik Pengeluaran per Kategori:** Menampilkan distribusi pengeluaran bulan berjalan dalam bentuk bar horizontal sederhana atau donut chart monokrom dengan warna teredam.
  * **Grafik Tren Bulanan:** Perbandingan Pemasukan vs Pengeluaran selama 6 bulan terakhir menggunakan grafik batang (bar chart).
* **Transaksi Terbaru:** Daftar 5 hingga 10 transaksi terakhir dengan tombol pintas menuju halaman riwayat lengkap.

## 4. Metrik Keberhasilan Teknis
* Waktu muat halaman awal (First Contentful Paint) di bawah 1.2 detik.
* Pembaruan antarmuka langsung (Optimistic UI atau invalidasi cepat via TanStack Query) setiap kali transaksi baru disimpan.
* Konsistensi saldo: Total saldo rekening selalu sama dengan `Saldo Awal + Total Pemasukan - Total Pengeluaran +/- Transfer`.
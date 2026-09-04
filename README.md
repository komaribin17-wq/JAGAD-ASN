# JAGAD ASN

Aplikasi skrining mandiri risiko judi online & jerat finansial digital untuk ASN, dilengkapi modul edukasi, tren skor pribadi, kanal pendampingan rahasia, dan dashboard admin untuk pemantauan agregat.

## Fitur

- **Login / Register** — akun berbasis NIK (16 digit) atau NIP (18 digit), tervalidasi formatnya.
- **JAGAD CHECK** — kuesioner skrining mandiri 10 pertanyaan, menghasilkan skor 0–100 dan tingkat risiko (rendah/sedang/tinggi).
- **JAGAD EDU** — modul literasi singkat seputar modus judi online, pinjol ilegal, dan keuangan sehat.
- **JAGAD TREND** — grafik riwayat skor risiko pribadi dari waktu ke waktu.
- **JAGAD CARE** — form konsultasi/pendampingan, bisa dikirim anonim.
- **Admin Dashboard** — ringkasan agregat, distribusi risiko per OPD, tabel hasil skrining (bisa difilter nama & dicetak), manajemen permintaan JAGAD CARE, dan tombol kirim pengingat WhatsApp manual.

## Tumpukan Teknologi

Vite + React + React Router + Tailwind CSS + Recharts + Supabase (Auth & Postgres).

## 1. Setup Awal

```bash
npm install
cp .env.example .env
```

Isi `.env` dengan kredensial project Supabase Anda:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Kredensial ini didapat dari **Supabase Dashboard → Project Settings → API**.

## 2. Setup Database Supabase

1. Buat project baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, tempel seluruh isi file `supabase/schema.sql`, lalu jalankan (RUN).
3. Ini akan membuat tabel `profiles`, `check_records`, `edu_progress`, `care_requests` beserta Row Level Security-nya.

### Wajib: matikan "Confirm email"

Aplikasi ini memetakan NIK/NIP ke alamat pseudo-email (`asn.<NIK/NIP>@gresikkab.go.id`) karena Supabase Auth mengharuskan format email. Domain ini dipakai karena valid secara DNS, **namun bukan kotak surat sungguhan** — jadi konfirmasi lewat email tidak akan pernah bisa selesai jika dibiarkan aktif.

1. Buka **Authentication → Providers/Sign In → Email** di dashboard Supabase.
2. Matikan opsi **"Confirm email"** (Enable email confirmations).
3. Simpan.

Tanpa langkah ini, proses Register/Login akan gagal atau menggantung.

### Membuat akun admin pertama

1. Jalankan aplikasi, daftar akun seperti biasa lewat halaman Register.
2. Di Supabase SQL Editor, jalankan:
   ```sql
   update public.profiles set role = 'admin' where id_pengguna = 'NIK_ATAU_NIP_ANDA';
   ```
3. Login ulang — menu **Admin** akan muncul di navbar.

## 3. Integrasi WhatsApp Business API (Pengingat Bulanan)

Fitur ini mengirim pesan WhatsApp otomatis tiap bulan ke ASN yang **belum** mengisi JAGAD CHECK, memakai **WhatsApp Business Platform (Cloud API) resmi Meta**. Selain terjadwal otomatis, admin juga bisa memicu pengiriman **kapan saja secara manual** lewat tombol "Kirim Pengingat Sekarang" di tab Ringkasan pada Admin Dashboard — cocok untuk uji coba atau pengingat tambahan di luar jadwal bulanan.

### 5.1 Siapkan akun Meta WhatsApp Business API

1. Buat aplikasi di [developers.facebook.com](https://developers.facebook.com) → tambahkan produk **WhatsApp**.
2. Di menu **WhatsApp → API Setup**, catat **Phone Number ID**.
3. Buat **permanent access token**: buka **Meta Business Suite → System Users**, buat System User baru, beri akses ke aplikasi WhatsApp Anda, lalu generate token permanen (token sementara di halaman API Setup hanya berlaku 24 jam — tidak cocok untuk penjadwalan otomatis).
4. Di menu **WhatsApp → Message Templates**, buat template baru, misalnya:
   - Nama: `jagad_check_reminder`
   - Kategori: **Utility**
   - Bahasa: Indonesian
   - Isi: `Yth {{1}}, Anda belum mengisi JAGAD CHECK bulan ini. Silakan isi melalui aplikasi JAGAD ASN untuk mendukung program pencegahan judi online di lingkungan ASN.`
   - Ajukan untuk **review** — biasanya disetujui dalam beberapa menit sampai 1 hari.

> **Catatan biaya:** Meta mengenakan biaya per percakapan (kategori Utility) yang bervariasi per negara. Pastikan cek [halaman harga WhatsApp Business Platform](https://developers.facebook.com/docs/whatsapp/pricing) sebelum mengaktifkan pengiriman massal.

### 5.2 Deploy Edge Function

1. Install [Supabase CLI](https://supabase.com/docs/guides/cli), lalu login: `supabase login`
2. Hubungkan ke project: `supabase link --project-ref <PROJECT_REF>` (lihat PROJECT_REF di URL dashboard)
3. Set secrets (kredensial Meta, disimpan aman di server, bukan di `.env` frontend):
   ```bash
   supabase secrets set WA_ACCESS_TOKEN=<permanent-access-token>
   supabase secrets set WA_PHONE_NUMBER_ID=<phone-number-id>
   supabase secrets set WA_TEMPLATE_NAME=jagad_check_reminder
   supabase secrets set WA_TEMPLATE_LANG=id
   ```
4. Deploy function:
   ```bash
   supabase functions deploy send-wa-reminder
   ```

### 5.3 Jadwalkan otomatis tiap bulan

1. Buka file `supabase/cron-wa-reminder.sql`, ganti `<PROJECT_REF>` dan `<SERVICE_ROLE_KEY>` (dari Project Settings → API) sesuai project Anda.
2. Jalankan seluruh isinya di **SQL Editor** Supabase.
3. Ini akan menjadwalkan pemanggilan Edge Function otomatis tiap tanggal 25 jam 08:00 WIB — bisa diubah lewat format cron di file tersebut.

### 5.4 Uji coba manual (tanpa menunggu jadwal)

Di dashboard Supabase → **Edge Functions** → `send-wa-reminder` → klik **Invoke**, atau lewat terminal:
```bash
curl -X POST https://<PROJECT_REF>.functions.supabase.co/send-wa-reminder \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>"
```
Responsnya berupa JSON berisi daftar ASN yang belum mengisi bulan ini beserta status pengiriman WA ke masing-masing.

## 4. Jalankan secara lokal

```bash
npm run dev
```

Buka `http://localhost:5173`.

## 5. Deploy ke GitHub Pages

1. Push project ini ke repository GitHub (misal bernama `JAGAD-ASN`).
2. Sesuaikan `base` di `vite.config.js` dengan nama repo Anda:
   ```js
   base: '/JAGAD-ASN/',
   ```
3. Di GitHub repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Di **Settings → Secrets and variables → Actions**, tambahkan dua repository secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Push ke branch `main` — workflow di `.github/workflows/deploy.yml` akan otomatis build & deploy.
6. Aplikasi akan tersedia di `https://<username>.github.io/JAGAD-ASN/`.

## Struktur Folder

```
src/
  lib/            supabaseClient.js, validators.js (validasi NIK/NIP)
  context/        AuthContext.jsx (sesi login & profil)
  components/     Navbar, Seal (logo), RiskBadge, ProtectedRoute
  pages/          Login, Register, Dashboard, JagadCheck, JagadEdu,
                   JagadTrend, JagadCare, Profile, AdminDashboard
supabase/
  schema.sql      Skema tabel + Row Level Security
.github/workflows/
  deploy.yml      CI/CD ke GitHub Pages
```

## Catatan Keamanan

- Semua akses data diatur lewat **Row Level Security** Supabase: pengguna biasa hanya bisa melihat datanya sendiri, admin bisa melihat semua data.
- NIK/NIP dipetakan ke alamat email semu (`<id>@jagadasn.local`) hanya untuk kebutuhan internal Supabase Auth — tidak dikirim email sungguhan.
- Jangan commit file `.env` ke repository (sudah masuk `.gitignore`).

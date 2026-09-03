# JAGAD ASN

Aplikasi skrining mandiri risiko judi online & jerat finansial digital untuk ASN, dilengkapi modul edukasi, tren skor pribadi, kanal pendampingan rahasia, dan dashboard admin untuk pemantauan agregat.

## Fitur

- **Login / Register** — akun berbasis NIK (16 digit) atau NIP (18 digit), tervalidasi formatnya.
- **JAGAD CHECK** — kuesioner skrining mandiri 10 pertanyaan, menghasilkan skor 0–100 dan tingkat risiko (rendah/sedang/tinggi).
- **JAGAD EDU** — modul literasi singkat seputar modus judi online, pinjol ilegal, dan keuangan sehat.
- **JAGAD TREND** — grafik riwayat skor risiko pribadi dari waktu ke waktu.
- **JAGAD CARE** — form konsultasi/pendampingan, bisa dikirim anonim.
- **Admin Dashboard** — ringkasan agregat, distribusi risiko per OPD, daftar hasil skrining, dan manajemen permintaan JAGAD CARE.

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

### Membuat akun admin pertama

1. Jalankan aplikasi, daftar akun seperti biasa lewat halaman Register.
2. Di Supabase SQL Editor, jalankan:
   ```sql
   update public.profiles set role = 'admin' where id_pengguna = 'NIK_ATAU_NIP_ANDA';
   ```
3. Login ulang — menu **Admin** akan muncul di navbar.

## 3. Jalankan secara lokal

```bash
npm run dev
```

Buka `http://localhost:5173`.

## 4. Deploy ke GitHub Pages

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

# JAGAD ASN — Versi Supabase (siap online)

Versi ini menggantikan penyimpanan sementara (`window.storage`, hanya jalan di dalam Claude)
dengan **Supabase** — database + autentikasi sungguhan — sehingga aplikasi bisa
dijalankan sebagai website online yang persisten dan diakses banyak pegawai sekaligus.

## 1. Buat project Supabase
1. Daftar/masuk ke https://supabase.com dan buat project baru (gratis untuk mulai).
2. Buka **SQL Editor**, tempel isi `schema.sql`, lalu jalankan (Run). Ini membuat
   tabel `profiles` dan `checkins` beserta aturan keamanan (Row Level Security)
   supaya pegawai hanya bisa melihat data miliknya sendiri, dan admin bisa melihat semua.
3. Buka **Authentication > Providers > Email**, matikan opsi "Confirm email"
   (untuk aplikasi internal instansi supaya pegawai bisa langsung login setelah daftar,
   tanpa perlu cek email — sesuaikan kalau instansi ingin verifikasi email tetap aktif).
4. Buka **Project Settings > API**, salin `Project URL` dan `anon public key`.

## 2. Jadikan satu akun sebagai Admin
Setelah ada minimal satu akun terdaftar lewat aplikasi (lewat layar "Daftar Akun"),
jalankan di SQL Editor:
```sql
update profiles set is_admin = true where nik_nip = 'NIK_ATAU_NIP_ADMIN_DISINI';
```
Akun ini nantinya login lewat layar "Masuk sebagai Admin" di aplikasi.

## 3. Jalankan secara lokal
```bash
npm create vite@latest jagad-asn -- --template react
cd jagad-asn
npm install @supabase/supabase-js lucide-react
```
Lalu:
- Salin `src/supabaseClient.js` dan `src/App.jsx` dari folder ini ke folder `src/` project Vite Anda (timpa yang lama).
- Buat file `.env` di root project:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```
- Jalankan: `npm run dev`, buka `http://localhost:5173`.

## 4. Deploy online
Cara termudah: hubungkan repo GitHub project ini ke **Vercel** atau **Netlify**,
lalu tambahkan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` sebagai Environment
Variables di dashboard Vercel/Netlify. Setelah deploy, aplikasi bisa diakses lewat
URL publik (bisa dipasangkan domain instansi sendiri).

## Catatan penting soal login NIK/NIP
Supabase Auth secara default berbasis **email**. Supaya pegawai tetap login pakai
NIK/NIP (bukan email), kode ini memetakan setiap NIK/NIP ke alamat email internal
buatan, contoh: `3201xxxxxxxxxxxx@jagad-asn.local` — lihat fungsi `emailFromId()`
di `App.jsx`. Ini aman karena email itu tidak pernah benar-benar dikirimi apa pun,
hanya dipakai sebagai identitas login di dalam sistem. Kalau instansi punya email
dinas resmi untuk tiap pegawai, ganti fungsi ini agar memakai email asli tersebut
supaya bisa dipakai juga untuk reset password lewat email.

## Keamanan & kepatuhan data (wajib dibaca sebelum dipakai resmi)
- Data hasil screening berkaitan dengan indikasi risiko digital/finansial pegawai —
  sebaiknya diperlakukan sebagai data sensitif secara internal.
- Row Level Security di `schema.sql` sudah membatasi akses per baris, tapi lakukan
  tinjauan keamanan tambahan (audit log, kebijakan retensi data, siapa saja yang
  boleh menjadi admin) sebelum dipakai lintas instansi.
- Sesuaikan dengan UU No. 27/2022 tentang Pelindungan Data Pribadi (PDP) sebelum
  aplikasi ini menyimpan data pegawai sungguhan secara resmi.

-- JAGAD ASN — skema Supabase
-- Jalankan di Supabase Dashboard > SQL Editor

-- 1) Tabel profil pegawai (satu baris per akun, terhubung ke auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  nik_nip text unique not null,
  id_type text check (id_type in ('NIK', 'NIP')),
  opd text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- 2) Tabel hasil screening JAGAD CHECK
create table if not exists checkins (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  score int not null check (score >= 0 and score <= 100),
  checkin_date date not null default current_date,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table checkins enable row level security;

-- Pegawai hanya boleh baca & ubah profilnya sendiri
create policy "profil milik sendiri - select"
  on profiles for select using (auth.uid() = id);
create policy "profil milik sendiri - update"
  on profiles for update using (auth.uid() = id);
create policy "profil milik sendiri - insert"
  on profiles for insert with check (auth.uid() = id);

-- Admin (is_admin = true) boleh baca SEMUA profil
create policy "admin baca semua profil"
  on profiles for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- Pegawai hanya boleh baca & tambah check-in miliknya sendiri
create policy "checkin milik sendiri - select"
  on checkins for select using (auth.uid() = profile_id);
create policy "checkin milik sendiri - insert"
  on checkins for insert with check (auth.uid() = profile_id);

-- Admin boleh baca SEMUA check-in
create policy "admin baca semua checkin"
  on checkins for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- Catatan: untuk menjadikan seorang pegawai sebagai admin, jalankan manual di SQL Editor:
--   update profiles set is_admin = true where nik_nip = 'NIK_ATAU_NIP_ADMIN';
-- Jangan pernah membuat form di aplikasi yang bisa mengubah is_admin sendiri.

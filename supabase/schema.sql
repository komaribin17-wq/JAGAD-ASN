-- ============================================================
-- JAGAD ASN — Skema database Supabase
-- Jalankan seluruh isi file ini di SQL Editor project Supabase Anda.
-- ============================================================

-- 1) PROFILES: data ASN, terhubung ke auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  id_pengguna text unique not null,
  jenis_id text not null check (jenis_id in ('NIK', 'NIP')),
  nama text not null,
  opd text,
  jabatan text,
  no_wa text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- Jika tabel profiles sudah pernah dibuat sebelumnya (project lama), jalankan baris ini
-- secara terpisah untuk menambahkan kolom nomor WhatsApp & foto profil:
-- alter table public.profiles add column if not exists no_wa text;
-- alter table public.profiles add column if not exists avatar_url text;

-- 2) CHECK_RECORDS: hasil skrining JAGAD CHECK
create table if not exists public.check_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  score int not null check (score between 0 and 100),
  risk_level text not null check (risk_level in ('rendah', 'sedang', 'tinggi')),
  answers jsonb,
  created_at timestamptz not null default now()
);

-- 3) EDU_PROGRESS: progres modul JAGAD EDU
create table if not exists public.edu_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  module_id text not null,
  completed_at timestamptz not null default now(),
  unique (user_id, module_id)
);

-- 4) CARE_REQUESTS: permintaan pendampingan JAGAD CARE (bisa anonim -> user_id null)
create table if not exists public.care_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  message text not null,
  status text not null default 'baru' check (status in ('baru', 'ditindaklanjuti', 'selesai')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.check_records enable row level security;
alter table public.edu_progress enable row level security;
alter table public.care_requests enable row level security;

-- Helper: cek apakah user saat ini adalah admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- PROFILES policies
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own_or_admin" on public.profiles
  for update using (auth.uid() = id or public.is_admin());

-- CHECK_RECORDS policies
create policy "check_records_select_own_or_admin" on public.check_records
  for select using (auth.uid() = user_id or public.is_admin());

create policy "check_records_insert_own" on public.check_records
  for insert with check (auth.uid() = user_id);

create policy "check_records_delete_admin" on public.check_records
  for delete using (public.is_admin());

-- EDU_PROGRESS policies
create policy "edu_progress_select_own_or_admin" on public.edu_progress
  for select using (auth.uid() = user_id or public.is_admin());

create policy "edu_progress_insert_own" on public.edu_progress
  for insert with check (auth.uid() = user_id);

-- CARE_REQUESTS policies
-- Siapa pun yang login boleh insert (baik atas nama sendiri maupun anonim/null)
create policy "care_requests_insert_authenticated" on public.care_requests
  for insert with check (auth.uid() is not null);

-- Hanya pemilik (jika bukan anonim) atau admin yang boleh membaca
create policy "care_requests_select_own_or_admin" on public.care_requests
  for select using (auth.uid() = user_id or public.is_admin());

-- Hanya admin yang boleh mengubah status
create policy "care_requests_update_admin_only" on public.care_requests
  for update using (public.is_admin());

-- Hanya admin yang boleh menghapus
create policy "care_requests_delete_admin" on public.care_requests
  for delete using (public.is_admin());

-- ============================================================
-- CATATAN: Membuat akun admin pertama
-- ============================================================
-- 1. Daftar akun biasa lewat halaman Register.
-- 2. Jalankan query berikut di SQL Editor (ganti NIK/NIP sesuai akun Anda):
--
--    update public.profiles set role = 'admin' where id_pengguna = 'NIK_ATAU_NIP_ANDA';

-- ============================================================
-- JAGAD ASN — Setup Storage bucket untuk foto profil
-- Jalankan file ini di SQL Editor Supabase, SETELAH schema.sql.
-- ============================================================

-- 1) Buat bucket 'avatars' (public agar foto bisa ditampilkan langsung lewat URL)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 2) Siapa pun boleh MELIHAT foto (karena bucket public & dipakai di UI aplikasi)
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

-- 3) Pengguna hanya boleh UPLOAD foto ke folder bernama sesuai user id mereka sendiri
--    (path yang dipakai aplikasi: avatars/<user_id>/avatar.<ext>)
create policy "avatars_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4) Pengguna hanya boleh MENGGANTI/MENIMPA foto mereka sendiri
create policy "avatars_update_own" on storage.objects
  for update using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 5) Pengguna hanya boleh MENGHAPUS foto mereka sendiri
create policy "avatars_delete_own" on storage.objects
  for delete using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- CATATAN
-- ============================================================
-- Kalau lebih nyaman lewat tampilan (bukan SQL), bucket ini juga bisa dibuat manual di
-- Supabase Dashboard: Storage → New bucket → nama 'avatars' → centang "Public bucket".
-- Tapi policy INSERT/UPDATE/DELETE di atas tetap perlu dijalankan lewat SQL Editor ini
-- supaya tiap ASN hanya bisa mengubah foto miliknya sendiri.

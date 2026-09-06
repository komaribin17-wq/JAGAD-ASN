-- ============================================================
-- JAGAD ASN — Tambahan izin (RLS) untuk fitur "Hapus" di Admin Dashboard
-- Jalankan file ini di SQL Editor Supabase kalau database Anda sudah
-- lebih dulu dibuat SEBELUM fitur hapus ini ada (schema.sql lama tidak
-- punya policy delete untuk check_records & care_requests).
-- Aman dijalankan walau sebagian sudah ada — akan error "already exists"
-- untuk yang sudah ada, tinggal abaikan baris itu dan lanjut yang lain.
-- ============================================================

create policy "check_records_delete_admin" on public.check_records
  for delete using (public.is_admin());

create policy "care_requests_delete_admin" on public.care_requests
  for delete using (public.is_admin());

-- ============================================================
-- JAGAD ASN — Penjadwalan otomatis pengingat WhatsApp bulanan
-- Jalankan file ini di SQL Editor Supabase SETELAH Edge Function
-- 'send-wa-reminder' berhasil di-deploy (lihat README.md bagian
-- "Integrasi WhatsApp Business API").
-- ============================================================

-- 1) Aktifkan extension yang dibutuhkan (aman dijalankan berulang)
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- 2) Hapus jadwal lama dengan nama yang sama (jika sebelumnya pernah dibuat)
select cron.unschedule('jagad-wa-reminder-monthly')
where exists (select 1 from cron.job where jobname = 'jagad-wa-reminder-monthly');

-- 3) Jadwalkan pemanggilan Edge Function tiap tanggal 25 jam 08:00 WIB (01:00 UTC)
--    GANTI dua placeholder di bawah ini:
--    - <PROJECT_REF>        -> lihat di URL dashboard: https://supabase.com/dashboard/project/<PROJECT_REF>
--    - <SERVICE_ROLE_KEY>   -> Project Settings > API > service_role key (RAHASIA, jangan sebar ke frontend!)
select cron.schedule(
  'jagad-wa-reminder-monthly',
  '0 1 25 * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.functions.supabase.co/send-wa-reminder',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- 4) Cek jadwal yang sudah terdaftar
select jobid, jobname, schedule, active from cron.job;

-- ============================================================
-- CATATAN
-- ============================================================
-- - Jadwal '0 1 25 * *' = menit 0, jam 01:00 UTC, tanggal 25, tiap bulan, tiap hari.
--   Sesuaikan jika ingin tanggal/jam lain (format cron: menit jam tanggal bulan hari-minggu).
-- - Untuk uji coba manual tanpa menunggu jadwal, panggil Edge Function langsung lewat
--   Supabase Dashboard > Edge Functions > send-wa-reminder > Invoke, atau lewat curl
--   (lihat README.md).

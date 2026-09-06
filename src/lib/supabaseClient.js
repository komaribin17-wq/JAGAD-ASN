import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum diset. Salin .env.example menjadi .env dan isi kredensial project Supabase Anda.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// NIK/NIP tidak bisa langsung dipakai sebagai email Supabase Auth,
// jadi kita petakan ke alamat pseudo-email yang konsisten & unik.
// Catatan: Supabase memvalidasi domain lewat DNS, sehingga domain buatan
// (mis. ".local" atau domain acak) akan ditolak. Dipakai domain resmi
// gresikkab.go.id (sudah pasti valid DNS-nya) hanya sebagai format alamat
// internal — TIDAK ADA email sungguhan yang terkirim ke domain ini,
// asalkan fitur "Confirm email" di Supabase Authentication settings
// dimatikan (lihat README).
export function idToPseudoEmail(idPengguna) {
  return `asn.${idPengguna.trim()}@gresikkab.go.id`
}

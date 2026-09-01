import { createClient } from "@supabase/supabase-js";

// Ambil dari Supabase Dashboard > Project Settings > API
// Simpan sebagai environment variable, JANGAN ditulis langsung di kode untuk produksi.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

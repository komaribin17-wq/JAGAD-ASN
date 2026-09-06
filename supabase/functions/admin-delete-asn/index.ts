// Supabase Edge Function: admin-delete-asn
// Menghapus akun ASN sepenuhnya (auth user + profil). Karena foreign key di
// check_records & edu_progress memakai "on delete cascade", data skrining &
// progres edukasi ASN tersebut ikut terhapus otomatis. Data di care_requests
// TIDAK ikut terhapus (di-anonim-kan lewat "on delete set null"), supaya
// riwayat permintaan pendampingan tetap ada untuk tindak lanjut admin.
// Hanya boleh dipicu oleh pengguna dengan role 'admin'.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // --- Otorisasi: hanya admin yang login boleh menghapus akun ASN
    const authHeader = req.headers.get('Authorization') || ''
    const jwt = authHeader.replace('Bearer ', '').trim()

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    const { data: userData } = await authClient.auth.getUser(jwt)
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: sesi tidak valid.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: pemanggil } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single()

    if (pemanggil?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized: hanya admin yang boleh menghapus akun.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { target_user_id } = await req.json()
    if (!target_user_id) {
      return new Response(JSON.stringify({ error: 'target_user_id wajib diisi.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Cegah admin menghapus akunnya sendiri lewat fitur ini (hindari terkunci dari sistem)
    if (target_user_id === userData.user.id) {
      return new Response(JSON.stringify({ error: 'Tidak bisa menghapus akun sendiri lewat fitur ini.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(target_user_id)
    if (deleteError) throw deleteError

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

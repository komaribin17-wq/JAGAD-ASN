// Supabase Edge Function: admin-reset-password
// Dipanggil dari Admin Dashboard saat admin mereset password ASN yang lupa.
// Hanya boleh dipicu oleh pengguna dengan role 'admin' (dicek lewat JWT pemanggil).

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

    // --- Otorisasi: hanya admin yang login boleh mereset password orang lain
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
      return new Response(JSON.stringify({ error: 'Unauthorized: hanya admin yang boleh mereset password.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // --- Ambil target user & password baru dari body
    const { target_user_id, new_password } = await req.json()

    if (!target_user_id || !new_password || String(new_password).length < 6) {
      return new Response(JSON.stringify({ error: 'target_user_id wajib diisi & new_password minimal 6 karakter.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(target_user_id, {
      password: new_password,
    })

    if (resetError) throw resetError

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

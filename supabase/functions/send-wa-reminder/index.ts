// VERSI DEBUG SEMENTARA — send-wa-reminder
// Tujuan: mencari tahu KENAPA jwt (dari cron) !== SERVICE_ROLE_KEY (dari env),
// tanpa membocorkan key penuh ke response/log.
// Setelah masalah ketemu, HAPUS blok debug ini dan kembalikan ke versi asli.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const WA_TOKEN = Deno.env.get('WA_ACCESS_TOKEN')!
const WA_PHONE_NUMBER_ID = Deno.env.get('WA_PHONE_NUMBER_ID')!
const WA_TEMPLATE_NAME = Deno.env.get('WA_TEMPLATE_NAME') ?? 'jagad_check_reminder'
const WA_TEMPLATE_LANG = Deno.env.get('WA_TEMPLATE_LANG') ?? 'id'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Helper: tampilkan info aman (panjang string + 6 karakter awal & akhir saja)
function maskInfo(label: string, value: string | undefined) {
  if (!value) return { label, exists: false }
  return {
    label,
    exists: true,
    length: value.length,
    starts: value.slice(0, 6),
    ends: value.slice(-6),
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    const authHeader = req.headers.get('Authorization') || ''
    const jwt = authHeader.replace('Bearer ', '').trim()

    let authorized = false
    let authPath = 'none'

    if (jwt === SERVICE_ROLE_KEY) {
      authorized = true
      authPath = 'service_role_exact_match'
    } else if (jwt) {
      const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      const { data: userData, error: userErr } = await authClient.auth.getUser(jwt)
      if (userData?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userData.user.id)
          .single()
        if (profile?.role === 'admin') {
          authorized = true
          authPath = 'admin_user_jwt'
        } else {
          authPath = `user_jwt_but_role=${profile?.role ?? 'unknown'}`
        }
      } else {
        authPath = `not_a_valid_user_jwt (${userErr?.message ?? 'no user'})`
      }
    }

    // --- DEBUG LOG: cek ini di Supabase Dashboard > Edge Functions > send-wa-reminder > Logs
    console.log('DEBUG_AUTH', JSON.stringify({
      authorized,
      authPath,
      incoming: maskInfo('incoming_jwt', jwt),
      envServiceRole: maskInfo('env_SUPABASE_SERVICE_ROLE_KEY', SERVICE_ROLE_KEY),
      envMatchesIncomingLength: jwt.length === SERVICE_ROLE_KEY?.length,
    }))

    if (!authorized) {
      // --- DEBUG: sertakan info masked di response juga, supaya kelihatan tanpa buka Logs
      return new Response(JSON.stringify({
        error: 'Unauthorized: hanya admin yang boleh memicu pengiriman ini.',
        debug: {
          authPath,
          incoming: maskInfo('incoming_jwt', jwt),
          envServiceRole: maskInfo('env_SUPABASE_SERVICE_ROLE_KEY', SERVICE_ROLE_KEY),
        },
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const { data: profiles, error: profileErr } = await supabase
      .from('profiles')
      .select('id, nama, no_wa')
      .not('no_wa', 'is', null)

    if (profileErr) throw profileErr

    const { data: sudahIsi, error: checkErr } = await supabase
      .from('check_records')
      .select('user_id')
      .gte('created_at', startOfMonth)

    if (checkErr) throw checkErr

    const sudahIsiSet = new Set((sudahIsi ?? []).map((r) => r.user_id))
    const belumIsi = (profiles ?? []).filter((p) => !sudahIsiSet.has(p.id))

    const hasil = []
    for (const p of belumIsi) {
      try {
        const res = await fetch(`https://graph.facebook.com/v20.0/${WA_PHONE_NUMBER_ID}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${WA_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: p.no_wa,
            type: 'template',
            template: {
              name: WA_TEMPLATE_NAME,
              language: { code: WA_TEMPLATE_LANG },
              components: [
                {
                  type: 'body',
                  parameters: [{ type: 'text', parameter_name: 'nama', text: p.nama }],
                },
              ],
            },
          }),
        })
        const json = await res.json()
        hasil.push({ user_id: p.id, ok: res.ok, response: json })
      } catch (err) {
        hasil.push({ user_id: p.id, ok: false, error: String(err) })
      }
    }

    return new Response(
      JSON.stringify({ total_belum_isi: belumIsi.length, hasil, authPath }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

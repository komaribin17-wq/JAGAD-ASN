import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import RiskBadge, { scoreToLevel } from '../components/RiskBadge'

const MODULES = [
  { to: '/check', title: 'JAGAD CHECK', desc: 'Skrining mandiri risiko keterlibatan judi online & jerat finansial digital.' },
  { to: '/edu', title: 'JAGAD EDU', desc: 'Materi literasi singkat tentang modus judol, pinjol ilegal, dan keuangan sehat.' },
  { to: '/trend', title: 'JAGAD TREND', desc: 'Grafik perkembangan skor risiko Anda dari waktu ke waktu.' },
  { to: '/care', title: 'JAGAD CARE', desc: 'Kanal pendampingan rahasia bila Anda atau rekan merasa mulai terjerat.' },
]

export default function Dashboard() {
  const { profile } = useAuth()
  const [lastCheck, setLastCheck] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('check_records')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      setLastCheck(data)
      setLoading(false)
    }
    load()
  }, [])

  const sudahIsiBulanIni = (() => {
    if (!lastCheck) return false
    const tgl = new Date(lastCheck.created_at)
    const now = new Date()
    return tgl.getMonth() === now.getMonth() && tgl.getFullYear() === now.getFullYear()
  })()

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-bronze-600 font-mono">Selamat datang,</p>
        <h1 className="font-display text-3xl font-semibold text-seal-900 mt-1">
          {profile?.nama || 'ASN'}
        </h1>
        <p className="text-ink/60 text-sm mt-1">
          {profile?.jabatan ? `${profile.jabatan} — ` : ''}{profile?.opd}
        </p>
      </div>

      <div className="doc-card p-6">
        <h2 className="font-display text-lg font-semibold mb-3">Status skrining terakhir</h2>
        {loading ? (
          <p className="text-sm text-ink/50">Memuat…</p>
        ) : lastCheck ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-4">
              <RiskBadge level={scoreToLevel(lastCheck.score)} />
              <span className="font-mono text-sm text-ink/70">
                Skor {lastCheck.score}/100 · {new Date(lastCheck.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <Link to="/check" className="text-sm text-seal-700 font-medium hover:underline ml-auto">
                Isi ulang skrining →
              </Link>
            </div>
            {sudahIsiBulanIni ? (
              <p className="text-sm text-risk-low bg-[#EAF1EC] border border-risk-low/30 rounded-seal px-3 py-2 inline-block">
                ✓ Anda sudah mengisi JAGAD CHECK bulan ini.
              </p>
            ) : (
              <p className="text-sm text-risk-medium bg-[#FBF2E1] border border-risk-medium/30 rounded-seal px-3 py-2 inline-block">
                Anda belum mengisi JAGAD CHECK bulan ini.
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-ink/60">Anda belum pernah mengisi JAGAD CHECK.</p>
            <Link to="/check" className="btn-primary text-sm !py-1.5 !px-4">Mulai skrining</Link>
          </div>
        )}
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold mb-3">Layanan JAGAD ASN</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {MODULES.map((m) => (
            <Link key={m.to} to={m.to} className="doc-card p-5 hover:border-seal-400 transition-colors block">
              <h3 className="font-display font-semibold text-seal-800">{m.title}</h3>
              <p className="text-sm text-ink/60 mt-1.5 leading-relaxed">{m.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

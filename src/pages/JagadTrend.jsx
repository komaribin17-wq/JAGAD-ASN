import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import RiskBadge, { scoreToLevel } from '../components/RiskBadge'

export default function JagadTrend() {
  const { user } = useAuth()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('check_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
      setRecords(data || [])
      setLoading(false)
    }
    load()
  }, [user])

  const chartData = records.map((r) => ({
    tanggal: new Date(r.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
    skor: r.score,
  }))

  const terakhir = records[records.length - 1]

  return (
    <div className="max-w-3xl mx-auto">
      <p className="text-sm text-bronze-600 font-mono">JAGAD TREND</p>
      <h1 className="font-display text-2xl font-semibold text-seal-900 mt-1">Tren Skor Risiko Anda</h1>
      <p className="text-sm text-ink/60 mt-1 mb-6">
        Grafik ini menampilkan riwayat skor JAGAD CHECK Anda dari waktu ke waktu.
      </p>

      {loading ? (
        <p className="text-sm text-ink/50">Memuat…</p>
      ) : records.length === 0 ? (
        <div className="doc-card p-8 text-center">
          <p className="text-sm text-ink/60">Belum ada data. Isi JAGAD CHECK terlebih dahulu untuk melihat tren.</p>
        </div>
      ) : (
        <>
          {terakhir && (
            <div className="doc-card p-5 mb-5 flex items-center gap-4 flex-wrap">
              <span className="text-xs font-mono text-ink/40">Skor terkini</span>
              <span className="font-display text-2xl font-semibold text-seal-900">{terakhir.score}/100</span>
              <RiskBadge level={scoreToLevel(terakhir.score)} />
              <span className="text-xs text-ink/40 ml-auto font-mono">{records.length} kali skrining</span>
            </div>
          )}

          <div className="doc-card p-5">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D8D3C2" />
                <XAxis dataKey="tanggal" tick={{ fontSize: 12, fill: '#1C2B22' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#1C2B22' }} />
                <ReferenceLine y={33} stroke="#C08A2E" strokeDasharray="4 4" />
                <ReferenceLine y={66} stroke="#A13A2E" strokeDasharray="4 4" />
                <Tooltip
                  contentStyle={{ fontFamily: 'IBM Plex Mono', fontSize: 12, border: '1px solid #D8D3C2', borderRadius: 4 }}
                  formatter={(value) => [`${value}/100`, 'Skor']}
                />
                <Line type="monotone" dataKey="skor" stroke="#1C4830" strokeWidth={2.5} dot={{ r: 4, fill: '#1C4830' }} />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-ink/40 font-mono mt-2">
              Garis putus-putus kuning = ambang sedang (33), merah = ambang tinggi (66)
            </p>
          </div>
        </>
      )}
    </div>
  )
}

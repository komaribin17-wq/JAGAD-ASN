import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { supabase } from '../lib/supabaseClient'
import RiskBadge, { scoreToLevel } from '../components/RiskBadge'

const TABS = [
  { id: 'ringkasan', label: 'Ringkasan' },
  { id: 'skrining', label: 'Data Skrining' },
  { id: 'care', label: 'Permintaan JAGAD CARE' },
  { id: 'asn', label: 'Kelola ASN' },
]

const RISK_COLOR = { rendah: '#3F7D4F', sedang: '#C08A2E', tinggi: '#A13A2E' }

export default function AdminDashboard() {
  const [tab, setTab] = useState('ringkasan')
  const [profiles, setProfiles] = useState([])
  const [checks, setChecks] = useState([])
  const [careRequests, setCareRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [opdFilter, setOpdFilter] = useState('Semua')
  const [namaFilter, setNamaFilter] = useState('')
  const [kirimWaStatus, setKirimWaStatus] = useState(null) // null | 'mengirim' | { total_belum_isi }
  const [asnFilter, setAsnFilter] = useState('')
  const [resetStatus, setResetStatus] = useState({}) // { [userId]: 'mereset' | 'sukses' | 'gagal' }
  const [hapusAsnStatus, setHapusAsnStatus] = useState({})

  useEffect(() => {
    async function load() {
      const [{ data: p }, { data: c }, { data: cr }] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('check_records').select('*, profiles(nama, opd)').order('created_at', { ascending: false }),
        supabase.from('care_requests').select('*, profiles(nama)').order('created_at', { ascending: false }),
      ])
      setProfiles(p || [])
      setChecks(c || [])
      setCareRequests(cr || [])
      setLoading(false)
    }
    load()
  }, [])

  const opdOptions = ['Semua', ...new Set(profiles.map((p) => p.opd).filter(Boolean))]

  const latestPerUser = Object.values(
    checks.reduce((acc, c) => {
      if (!acc[c.user_id] || new Date(c.created_at) > new Date(acc[c.user_id].created_at)) {
        acc[c.user_id] = c
      }
      return acc
    }, {})
  ).filter((c) => opdFilter === 'Semua' || c.profiles?.opd === opdFilter)

  const distribusi = ['rendah', 'sedang', 'tinggi'].map((level) => ({
    level,
    label: level === 'rendah' ? 'Rendah' : level === 'sedang' ? 'Sedang' : 'Tinggi',
    jumlah: latestPerUser.filter((c) => scoreToLevel(c.score) === level).length,
  }))

  async function updateCareStatus(id, status) {
    await supabase.from('care_requests').update({ status }).eq('id', id)
    setCareRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
  }

  async function kirimWaManual() {
    setKirimWaStatus('mengirim')
    try {
      const { data, error } = await supabase.functions.invoke('send-wa-reminder', { method: 'POST' })
      if (error) throw error
      setKirimWaStatus({ total_belum_isi: data?.total_belum_isi ?? 0 })
    } catch (err) {
      setKirimWaStatus({ error: err.message || 'Gagal mengirim.' })
    }
  }

  const checksTerfilter = checks.filter((c) =>
    (c.profiles?.nama || '').toLowerCase().includes(namaFilter.toLowerCase())
  )

  function cetakDataSkrining() {
    const baris = checksTerfilter
      .map(
        (c) => `
        <tr>
          <td>${c.profiles?.nama || '—'}</td>
          <td>${c.profiles?.opd || '—'}</td>
          <td>${c.score}</td>
          <td>${scoreToLevel(c.score).toUpperCase()}</td>
          <td>${new Date(c.created_at).toLocaleDateString('id-ID')}</td>
        </tr>`
      )
      .join('')

    const html = `
      <html>
        <head>
          <title>Data Skrining JAGAD CHECK</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #1C2B22; }
            h1 { font-size: 18px; margin-bottom: 4px; }
            p.sub { font-size: 12px; color: #555; margin-top: 0; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #999; padding: 6px 8px; text-align: left; }
            th { background: #EAF1EC; }
          </style>
        </head>
        <body>
          <h1>Data Skrining JAGAD CHECK — JAGAD ASN</h1>
          <p class="sub">Dicetak pada ${new Date().toLocaleString('id-ID')}${namaFilter ? ` · Filter nama: "${namaFilter}"` : ''}</p>
          <table>
            <thead>
              <tr><th>Nama</th><th>OPD</th><th>Skor</th><th>Tingkat</th><th>Tanggal</th></tr>
            </thead>
            <tbody>${baris}</tbody>
          </table>
        </body>
      </html>
    `

    const jendela = window.open('', '_blank')
    jendela.document.write(html)
    jendela.document.close()
    jendela.focus()
    jendela.print()
  }

  async function resetPasswordAsn(targetUserId, namaAsn) {
    const passwordBaru = window.prompt(
      `Masukkan kata sandi BARU untuk ${namaAsn} (minimal 6 karakter).\nSampaikan kata sandi ini ke ybs secara langsung/rahasia.`
    )
    if (!passwordBaru) return
    if (passwordBaru.length < 6) {
      alert('Kata sandi minimal 6 karakter.')
      return
    }

    setResetStatus((prev) => ({ ...prev, [targetUserId]: 'mereset' }))
    try {
      const { error } = await supabase.functions.invoke('admin-reset-password', {
        body: { target_user_id: targetUserId, new_password: passwordBaru },
      })
      if (error) throw error
      setResetStatus((prev) => ({ ...prev, [targetUserId]: 'sukses' }))
    } catch (err) {
      setResetStatus((prev) => ({ ...prev, [targetUserId]: 'gagal' }))
      alert('Gagal mereset password: ' + (err.message || 'terjadi kesalahan'))
    }
    setTimeout(() => setResetStatus((prev) => ({ ...prev, [targetUserId]: null })), 3000)
  }

  const asnTerfilter = profiles.filter((p) =>
    (p.nama || '').toLowerCase().includes(asnFilter.toLowerCase())
  )

  async function hapusCheckRecord(id, namaAsn) {
    if (!window.confirm(`Hapus data skrining milik ${namaAsn} ini? Tindakan ini tidak bisa dibatalkan.`)) return
    const { error } = await supabase.from('check_records').delete().eq('id', id)
    if (error) {
      alert('Gagal menghapus: ' + error.message)
      return
    }
    setChecks((prev) => prev.filter((c) => c.id !== id))
  }

  async function hapusCareRequest(id, namaAsn) {
    if (!window.confirm(`Hapus permintaan pendampingan dari ${namaAsn || 'Anonim'} ini? Tindakan ini tidak bisa dibatalkan.`)) return
    const { error } = await supabase.from('care_requests').delete().eq('id', id)
    if (error) {
      alert('Gagal menghapus: ' + error.message)
      return
    }
    setCareRequests((prev) => prev.filter((r) => r.id !== id))
  }

  async function hapusAsn(targetUserId, namaAsn) {
    const konfirmasi = window.prompt(
      `PERINGATAN: ini akan menghapus akun ${namaAsn} SEPENUHNYA, termasuk seluruh riwayat skrining & progres edukasinya. Tindakan ini TIDAK BISA DIBATALKAN.\n\nKetik "HAPUS" (huruf besar) untuk melanjutkan:`
    )
    if (konfirmasi !== 'HAPUS') return

    setHapusAsnStatus((prev) => ({ ...prev, [targetUserId]: 'menghapus' }))
    try {
      const { error } = await supabase.functions.invoke('admin-delete-asn', {
        body: { target_user_id: targetUserId },
      })
      if (error) throw error
      setProfiles((prev) => prev.filter((p) => p.id !== targetUserId))
      setChecks((prev) => prev.filter((c) => c.user_id !== targetUserId))
    } catch (err) {
      setHapusAsnStatus((prev) => ({ ...prev, [targetUserId]: null }))
      alert('Gagal menghapus akun: ' + (err.message || 'terjadi kesalahan'))
    }
  }

  if (loading) return <p className="text-sm text-ink/50">Memuat data…</p>

  return (
    <div>
      <p className="text-sm text-bronze-600 font-mono">Admin</p>
      <h1 className="font-display text-2xl font-semibold text-seal-900 mt-1 mb-1">Dashboard Pemantauan</h1>
      <p className="text-sm text-ink/60 mb-6">Data agregat untuk mendukung kebijakan pencegahan judi online di kalangan ASN.</p>

      <div className="flex gap-1 mb-6 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id ? 'border-seal-700 text-seal-800' : 'border-transparent text-ink/50 hover:text-ink/80'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'ringkasan' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Total ASN terdaftar" value={profiles.length} />
            <StatCard label="Sudah isi skrining" value={latestPerUser.length} />
            <StatCard label="Risiko tinggi" value={distribusi.find((d) => d.level === 'tinggi')?.jumlah || 0} accent="high" />
            <StatCard label="Permintaan CARE baru" value={careRequests.filter((r) => r.status === 'baru').length} accent="care" />
          </div>

          <div className="doc-card p-5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="font-display font-semibold text-seal-800">Pengingat WhatsApp Bulanan</h2>
                <p className="text-sm text-ink/60 mt-1">
                  Otomatis terjadwal tiap tanggal 25. Bisa juga dipicu manual kapan saja lewat tombol ini.
                </p>
              </div>
              <button
                onClick={kirimWaManual}
                disabled={kirimWaStatus === 'mengirim'}
                className="btn-primary text-sm whitespace-nowrap"
              >
                {kirimWaStatus === 'mengirim' ? 'Mengirim…' : 'Kirim Pengingat Sekarang'}
              </button>
            </div>
            {kirimWaStatus && kirimWaStatus !== 'mengirim' && (
              <p className={`text-sm mt-3 px-3 py-2 rounded-seal inline-block ${
                kirimWaStatus.error
                  ? 'text-risk-high bg-[#F7E8E5] border border-risk-high/30'
                  : 'text-risk-low bg-[#EAF1EC] border border-risk-low/30'
              }`}>
                {kirimWaStatus.error
                  ? `Gagal: ${kirimWaStatus.error}`
                  : `Terkirim ke ${kirimWaStatus.total_belum_isi} ASN yang belum mengisi bulan ini.`}
              </p>
            )}
          </div>

          <div className="doc-card p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="font-display font-semibold text-seal-800">Distribusi Tingkat Risiko</h2>
              <select value={opdFilter} onChange={(e) => setOpdFilter(e.target.value)} className="input-field !w-auto text-sm !py-1.5">
                {opdOptions.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={distribusi} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D8D3C2" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#1C2B22' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#1C2B22' }} />
                <Tooltip contentStyle={{ fontFamily: 'IBM Plex Mono', fontSize: 12, border: '1px solid #D8D3C2', borderRadius: 4 }} />
                <Bar dataKey="jumlah" radius={[4, 4, 0, 0]}>
                  {distribusi.map((d) => <Cell key={d.level} fill={RISK_COLOR[d.level]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'skrining' && (
        <div>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <input
              type="text"
              value={namaFilter}
              onChange={(e) => setNamaFilter(e.target.value)}
              placeholder="Cari nama ASN…"
              className="input-field !w-auto flex-1 min-w-[200px] text-sm"
            />
            <button onClick={cetakDataSkrining} className="btn-secondary text-sm whitespace-nowrap">
              🖨 Cetak
            </button>
          </div>

          <div className="doc-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-mono text-ink/50 uppercase tracking-wide">
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">OPD</th>
                  <th className="px-4 py-3">Skor</th>
                  <th className="px-4 py-3">Tingkat</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {checksTerfilter.map((c) => (
                  <tr key={c.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-medium">{c.profiles?.nama || '—'}</td>
                    <td className="px-4 py-3 text-ink/60">{c.profiles?.opd || '—'}</td>
                    <td className="px-4 py-3 font-mono">{c.score}</td>
                    <td className="px-4 py-3"><RiskBadge level={scoreToLevel(c.score)} /></td>
                    <td className="px-4 py-3 text-ink/50 font-mono text-xs">
                      {new Date(c.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => hapusCheckRecord(c.id, c.profiles?.nama || 'ASN ini')}
                        className="text-xs font-medium text-risk-high hover:underline whitespace-nowrap"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
                {checksTerfilter.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-ink/40">
                    {namaFilter ? 'Tidak ada hasil untuk nama tersebut.' : 'Belum ada data skrining.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'care' && (
        <div className="space-y-3">
          {careRequests.length === 0 && (
            <p className="text-sm text-ink/50">Belum ada permintaan pendampingan.</p>
          )}
          {careRequests.map((r) => (
            <div key={r.id} className="doc-card p-5">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                <span className="text-sm font-semibold text-seal-800">
                  {r.profiles?.nama || 'Anonim'}
                </span>
                <div className="flex items-center gap-2">
                  <StatusPill status={r.status} />
                  <select
                    value={r.status}
                    onChange={(e) => updateCareStatus(r.id, e.target.value)}
                    className="input-field !w-auto text-xs !py-1"
                  >
                    <option value="baru">Baru</option>
                    <option value="ditindaklanjuti">Ditindaklanjuti</option>
                    <option value="selesai">Selesai</option>
                  </select>
                  <button
                    onClick={() => hapusCareRequest(r.id, r.profiles?.nama)}
                    className="text-xs font-medium text-risk-high hover:underline whitespace-nowrap"
                  >
                    Hapus
                  </button>
                </div>
              </div>
              <p className="text-sm text-ink/70 leading-relaxed">{r.message}</p>
              <p className="text-xs text-ink/40 font-mono mt-2">
                {new Date(r.created_at).toLocaleString('id-ID')}
              </p>
            </div>
          ))}
        </div>
      )}

      {tab === 'asn' && (
        <div>
          <input
            type="text"
            value={asnFilter}
            onChange={(e) => setAsnFilter(e.target.value)}
            placeholder="Cari nama ASN…"
            className="input-field !w-auto min-w-[220px] text-sm mb-4"
          />

          <div className="doc-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-mono text-ink/50 uppercase tracking-wide">
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">NIK/NIP</th>
                  <th className="px-4 py-3">OPD</th>
                  <th className="px-4 py-3">No. WA</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {asnTerfilter.map((p) => (
                  <tr key={p.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                      {p.avatar_url ? (
                        <img src={p.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <span className="w-6 h-6 rounded-full bg-seal-50 border border-seal-200 flex items-center justify-center text-[10px] font-display text-seal-700">
                          {p.nama?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      )}
                      {p.nama}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink/60">{p.id_pengguna}</td>
                    <td className="px-4 py-3 text-ink/60">{p.opd || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-ink/60">{p.no_wa || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full ${
                        p.role === 'admin' ? 'bg-bronze-200/40 text-bronze-700' : 'bg-seal-50 text-seal-700'
                      }`}>
                        {p.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => resetPasswordAsn(p.id, p.nama)}
                          disabled={resetStatus[p.id] === 'mereset'}
                          className="text-xs font-medium text-seal-700 hover:underline whitespace-nowrap"
                        >
                          {resetStatus[p.id] === 'mereset'
                            ? 'Mereset…'
                            : resetStatus[p.id] === 'sukses'
                            ? 'Berhasil ✓'
                            : 'Reset Password'}
                        </button>
                        <button
                          onClick={() => hapusAsn(p.id, p.nama)}
                          disabled={hapusAsnStatus[p.id] === 'menghapus'}
                          className="text-xs font-medium text-risk-high hover:underline whitespace-nowrap"
                        >
                          {hapusAsnStatus[p.id] === 'menghapus' ? 'Menghapus…' : 'Hapus'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {asnTerfilter.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-ink/40">
                    {asnFilter ? 'Tidak ada hasil untuk nama tersebut.' : 'Belum ada ASN terdaftar.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, accent }) {
  const color = accent === 'high' ? 'text-risk-high' : accent === 'care' ? 'text-bronze-600' : 'text-seal-800'
  return (
    <div className="doc-card p-4">
      <p className="text-xs font-mono text-ink/40 uppercase tracking-wide">{label}</p>
      <p className={`font-display text-2xl font-semibold mt-1 ${color}`}>{value}</p>
    </div>
  )
}

function StatusPill({ status }) {
  const cfg = {
    baru: { bg: '#F7E8E5', text: '#A13A2E' },
    ditindaklanjuti: { bg: '#FBF2E1', text: '#C08A2E' },
    selesai: { bg: '#EAF1EC', text: '#3F7D4F' },
  }[status] || { bg: '#EEE', text: '#666' }
  return (
    <span
      className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: cfg.bg, color: cfg.text }}
    >
      {status}
    </span>
  )
}

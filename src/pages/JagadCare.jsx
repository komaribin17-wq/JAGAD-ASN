import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

export default function JagadCare() {
  const { user } = useAuth()
  const [pesan, setPesan] = useState('')
  const [anonim, setAnonim] = useState(true)
  const [terkirim, setTerkirim] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!pesan.trim()) return
    setSaving(true)
    setError('')
    const { error } = await supabase.from('care_requests').insert({
      user_id: anonim ? null : user.id,
      message: pesan.trim(),
      status: 'baru',
    })
    setSaving(false)
    if (error) {
      setError('Gagal mengirim, coba lagi beberapa saat lagi.')
      return
    }
    setTerkirim(true)
    setPesan('')
  }

  return (
    <div className="max-w-xl mx-auto">
      <p className="text-sm text-bronze-600 font-mono">JAGAD CARE</p>
      <h1 className="font-display text-2xl font-semibold text-seal-900 mt-1">Layanan Pendampingan</h1>
      <p className="text-sm text-ink/60 mt-1 mb-6 leading-relaxed">
        Ruang aman untuk bercerita bila Anda atau rekan kerja mulai terjerat judi online atau pinjaman
        ilegal. Tim pendamping akan menindaklanjuti secara rahasia dan tidak menghakimi.
      </p>

      <div className="doc-card p-5 mb-5 bg-seal-50/40 border-seal-200">
        <h2 className="font-display font-semibold text-seal-800 text-sm mb-2">Kontak darurat</h2>
        <ul className="text-sm text-ink/70 space-y-1 font-mono">
          <li>BKPSDM Pemkab Gresik — (031) xxx-xxxx</li>
          <li>Layanan Konseling Internal — konseling@gresikkab.go.id</li>
          <li>Ikatan Psikolog Klinis (call center nasional) — 119 ext. 8</li>
        </ul>
      </div>

      {terkirim ? (
        <div className="doc-card p-6 text-center">
          <p className="font-display font-semibold text-seal-800 mb-1">Pesan Anda telah terkirim</p>
          <p className="text-sm text-ink/60">Tim pendamping akan menghubungi Anda sesegera mungkin. Terima kasih sudah berani bercerita.</p>
          <button onClick={() => setTerkirim(false)} className="btn-secondary text-sm mt-4">Kirim pesan lain</button>
        </div>
      ) : (
        <form onSubmit={submit} className="doc-card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Ceritakan situasi Anda</label>
            <textarea
              required
              rows={5}
              value={pesan}
              onChange={(e) => setPesan(e.target.value)}
              placeholder="Anda bisa menulis sebebas mungkin. Tidak ada jawaban yang salah."
              className="input-field resize-none"
            />
          </div>

          <label className="flex items-center gap-2.5 text-sm text-ink/70">
            <input
              type="checkbox"
              checked={anonim}
              onChange={(e) => setAnonim(e.target.checked)}
              className="w-4 h-4 accent-seal-700"
            />
            Kirim secara anonim (identitas saya tidak disertakan)
          </label>

          {error && <p className="text-sm text-risk-high">{error}</p>}

          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Mengirim…' : 'Kirim'}
          </button>
        </form>
      )}
    </div>
  )
}

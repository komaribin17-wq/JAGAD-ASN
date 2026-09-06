import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import RiskBadge, { scoreToLevel } from '../components/RiskBadge'

const PERTANYAAN = [
  'Dalam 3 bulan terakhir, seberapa sering Anda bermain aplikasi/situs yang melibatkan taruhan uang (termasuk "slot", "togel online", atau sejenisnya)?',
  'Seberapa sering Anda merasa perlu menaikkan jumlah taruhan untuk mendapatkan sensasi yang sama?',
  'Pernahkah Anda meminjam uang (termasuk pinjaman online) untuk menutup kerugian akibat judi atau taruhan?',
  'Seberapa sering Anda mencoba berhenti namun gagal?',
  'Seberapa sering aktivitas ini mengganggu pekerjaan atau tanggung jawab sebagai ASN?',
  'Apakah Anda pernah menyembunyikan aktivitas ini dari keluarga atau rekan kerja?',
  'Seberapa sering Anda merasa cemas atau gelisah ketika tidak bisa mengakses aplikasi tersebut?',
  'Apakah kondisi keuangan rumah tangga Anda mulai terganggu dalam 3 bulan terakhir?',
  'Pernahkah Anda menerima tawaran/iklan judi online melalui SMS, WhatsApp, atau media sosial dan tergoda untuk mencoba?',
  'Seberapa yakin Anda dapat mengendalikan diri sepenuhnya dari ajakan judi online ke depannya? (jawaban rendah = kurang yakin)',
]

const OPSI = [
  { value: 0, label: 'Tidak pernah' },
  { value: 1, label: 'Jarang' },
  { value: 2, label: 'Kadang-kadang' },
  { value: 3, label: 'Sering' },
  { value: 4, label: 'Selalu' },
]

export default function JagadCheck() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [jawaban, setJawaban] = useState(Array(PERTANYAAN.length).fill(null))
  const [step, setStep] = useState(0)
  const [result, setResult] = useState(null)
  const [saving, setSaving] = useState(false)

  const allAnswered = jawaban.every((j) => j !== null)

  function pilih(value) {
    const next = [...jawaban]
    next[step] = value
    setJawaban(next)
    if (step < PERTANYAAN.length - 1) {
      setTimeout(() => setStep(step + 1), 150)
    }
  }

  async function submit() {
    // Pertanyaan terakhir dibalik skornya (keyakinan tinggi = risiko rendah)
    const raw = jawaban.reduce((sum, v, i) => {
      const nilai = i === PERTANYAAN.length - 1 ? 4 - v : v
      return sum + nilai
    }, 0)
    const maxRaw = PERTANYAAN.length * 4
    const score = Math.round((raw / maxRaw) * 100)
    const level = scoreToLevel(score)

    setSaving(true)
    await supabase.from('check_records').insert({
      user_id: user.id,
      score,
      risk_level: level,
      answers: jawaban,
    })
    setSaving(false)
    setResult({ score, level })
  }

  if (result) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="doc-card p-8 text-center">
          <p className="text-sm text-bronze-600 font-mono mb-2">Hasil JAGAD CHECK</p>
          <div className="font-display text-5xl font-semibold text-seal-900 my-3">
            {result.score}<span className="text-2xl text-ink/40">/100</span>
          </div>
          <RiskBadge level={result.level} />

          <div className="text-left mt-6 pt-6 border-t border-line space-y-3 text-sm text-ink/70 leading-relaxed">
            {result.level === 'rendah' && (
              <p>Indikasi risiko Anda saat ini rendah. Tetap jaga kewaspadaan terhadap tawaran judi online yang sering menyamar sebagai promo atau investasi.</p>
            )}
            {result.level === 'sedang' && (
              <p>Terdapat beberapa indikasi risiko yang perlu diwaspadai. Kami sarankan mengikuti modul JAGAD EDU dan memantau kebiasaan Anda melalui JAGAD TREND secara berkala.</p>
            )}
            {result.level === 'tinggi' && (
              <p>Hasil skrining menunjukkan indikasi risiko tinggi. Anda tidak sendirian — layanan JAGAD CARE menyediakan pendampingan rahasia dan tidak menghakimi. Kami sangat menyarankan Anda menghubungi kanal tersebut.</p>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={() => navigate('/trend')} className="btn-secondary flex-1 text-sm">Lihat tren</button>
            {result.level !== 'rendah' ? (
              <button onClick={() => navigate('/care')} className="btn-primary flex-1 text-sm">Ke JAGAD CARE</button>
            ) : (
              <button onClick={() => navigate('/')} className="btn-primary flex-1 text-sm">Ke beranda</button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-5">
        <p className="text-sm text-bronze-600 font-mono">JAGAD CHECK</p>
        <h1 className="font-display text-2xl font-semibold text-seal-900 mt-1">Skrining Mandiri</h1>
        <p className="text-sm text-ink/60 mt-1">Jawaban Anda bersifat rahasia. Jawab sejujur-jujurnya.</p>
      </div>

      <div className="w-full bg-line rounded-full h-1.5 mb-6">
        <div
          className="bg-seal-600 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${((step + 1) / PERTANYAAN.length) * 100}%` }}
        />
      </div>

      <div className="doc-card p-6">
        <p className="text-xs font-mono text-ink/40 mb-2">Pertanyaan {step + 1} dari {PERTANYAAN.length}</p>
        <p className="font-display text-lg font-medium leading-snug mb-5">{PERTANYAAN[step]}</p>

        <div className="space-y-2">
          {OPSI.map((opt) => (
            <button
              key={opt.value}
              onClick={() => pilih(opt.value)}
              className={`w-full text-left px-4 py-2.5 rounded-seal border text-sm font-medium transition-colors ${
                jawaban[step] === opt.value
                  ? 'border-seal-600 bg-seal-50 text-seal-800'
                  : 'border-line hover:border-seal-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="text-sm text-ink/50 disabled:opacity-30 font-medium"
          >
            ← Sebelumnya
          </button>
          {step === PERTANYAAN.length - 1 && allAnswered && (
            <button onClick={submit} disabled={saving} className="btn-primary text-sm">
              {saving ? 'Menyimpan…' : 'Lihat hasil'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

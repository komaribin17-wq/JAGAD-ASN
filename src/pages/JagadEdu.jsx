import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

const MODUL = [
  {
    id: 'mod-1',
    judul: 'Mengenali Modus Judi Online Terbaru',
    ringkas: 'Judi online kini menyamar sebagai game, aplikasi "prediksi", atau investasi kripto abal-abal.',
    isi: [
      'Judi online sering menyamar sebagai aplikasi game kasual, "prediksi skor bola", atau skema investasi berbunga tinggi.',
      'Ciri umum: iming-iming kemenangan besar di awal, testimoni palsu, dan tekanan untuk segera transfer/top-up.',
      'Waspadai tautan yang dibagikan lewat grup WhatsApp/Telegram dengan embel-embel "bonus member baru".',
    ],
  },
  {
    id: 'mod-2',
    judul: 'Jerat Pinjaman Online Ilegal',
    ringkas: 'Pinjol ilegal kerap menjadi jalan pintas menutup kerugian judi, namun bunga dan tekanan penagihannya sangat merugikan.',
    isi: [
      'Pinjol ilegal biasanya tidak terdaftar di OJK, proses pencairan sangat cepat tanpa verifikasi memadai.',
      'Bunga dan denda bisa berlipat-lipat dari pokok pinjaman dalam hitungan minggu.',
      'Penagihan sering melibatkan intimidasi, penyebaran data pribadi ke kontak di ponsel peminjam.',
      'Cek legalitas pinjaman di laman resmi OJK sebelum mengajukan pinjaman apa pun.',
    ],
  },
  {
    id: 'mod-3',
    judul: 'Dampak bagi ASN: Disiplin & Hukum',
    ringkas: 'Keterlibatan ASN dalam judi online berpotensi melanggar disiplin PNS hingga berujung sanksi.',
    isi: [
      'Judi online termasuk perbuatan yang bertentangan dengan kode etik dan disiplin ASN.',
      'Selain sanksi kepegawaian, keterlibatan dalam judi online juga merupakan tindak pidana menurut UU ITE dan KUHP.',
      'Masalah keuangan akibat judi dapat berdampak pada kinerja, integritas, dan reputasi instansi.',
    ],
  },
  {
    id: 'mod-4',
    judul: 'Membangun Kebiasaan Keuangan Sehat',
    ringkas: 'Literasi keuangan dasar membantu ASN lebih tahan terhadap godaan "cepat kaya" dari judi online.',
    isi: [
      'Susun anggaran bulanan dan sisihkan dana darurat sebelum pengeluaran lain.',
      'Hindari utang konsumtif untuk gaya hidup, apalagi untuk aktivitas berisiko seperti judi.',
      'Jika tergoda mencoba, ingat: peluang menang di judi online didesain untuk menguntungkan bandar, bukan pemain.',
    ],
  },
  {
    id: 'mod-5',
    judul: 'Langkah Jika Rekan Kerja Terindikasi Terjerat',
    ringkas: 'Dukungan dari lingkungan kerja sangat membantu proses pemulihan tanpa menghakimi.',
    isi: [
      'Ajak bicara secara personal dan tidak menghakimi; hindari mempermalukan di depan umum.',
      'Dorong untuk memanfaatkan layanan JAGAD CARE atau layanan konseling instansi.',
      'Laporkan ke atasan/BKD hanya jika diperlukan untuk perlindungan, dengan tetap menjaga kerahasiaan data pribadi rekan.',
    ],
  },
]

export default function JagadEdu() {
  const { user } = useAuth()
  const [selesai, setSelesai] = useState(new Set())
  const [terbuka, setTerbuka] = useState(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('edu_progress')
        .select('module_id')
        .eq('user_id', user.id)
      if (data) setSelesai(new Set(data.map((d) => d.module_id)))
    }
    load()
  }, [user])

  async function tandaiSelesai(moduleId) {
    if (selesai.has(moduleId)) return
    await supabase.from('edu_progress').insert({ user_id: user.id, module_id: moduleId })
    setSelesai((prev) => new Set(prev).add(moduleId))
  }

  const progress = Math.round((selesai.size / MODUL.length) * 100)

  return (
    <div className="max-w-2xl mx-auto">
      <p className="text-sm text-bronze-600 font-mono">JAGAD EDU</p>
      <h1 className="font-display text-2xl font-semibold text-seal-900 mt-1">Literasi Digital & Keuangan</h1>
      <p className="text-sm text-ink/60 mt-1 mb-2">
        Selesaikan modul singkat berikut untuk memperkuat kewaspadaan Anda.
      </p>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 bg-line rounded-full h-1.5">
          <div className="bg-bronze-600 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-xs font-mono text-ink/50">{selesai.size}/{MODUL.length} selesai</span>
      </div>

      <div className="space-y-3">
        {MODUL.map((m) => {
          const isSelesai = selesai.has(m.id)
          const isTerbuka = terbuka === m.id
          return (
            <div key={m.id} className="doc-card overflow-hidden">
              <button
                onClick={() => setTerbuka(isTerbuka ? null : m.id)}
                className="w-full text-left p-5 flex items-start justify-between gap-4"
              >
                <div>
                  <h3 className="font-display font-semibold text-seal-800">{m.judul}</h3>
                  <p className="text-sm text-ink/60 mt-1">{m.ringkas}</p>
                </div>
                {isSelesai && (
                  <span className="shrink-0 text-xs font-mono font-semibold text-seal-700 bg-seal-50 border border-seal-200 rounded-full px-2.5 py-1">
                    Selesai
                  </span>
                )}
              </button>

              {isTerbuka && (
                <div className="px-5 pb-5 pt-1 border-t border-line">
                  <ul className="list-disc list-inside space-y-1.5 text-sm text-ink/70 leading-relaxed">
                    {m.isi.map((baris, i) => <li key={i}>{baris}</li>)}
                  </ul>
                  {!isSelesai && (
                    <button
                      onClick={() => tandaiSelesai(m.id)}
                      className="btn-primary text-sm mt-4 !py-1.5 !px-4"
                    >
                      Tandai selesai
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

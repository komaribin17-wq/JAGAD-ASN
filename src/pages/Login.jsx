import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, idToPseudoEmail } from '../lib/supabaseClient'
import Seal from '../components/Seal'

export default function Login() {
  const [idPengguna, setIdPengguna] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: idToPseudoEmail(idPengguna),
      password,
    })

    setLoading(false)
    if (error) {
      setError('NIK/NIP atau kata sandi salah. Periksa kembali dan coba lagi.')
      return
    }
    navigate('/')
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Seal size={56} />
          <h1 className="font-display text-2xl font-semibold text-seal-900 mt-3">JAGAD ASN</h1>
          <p className="text-sm text-ink/60 mt-1 text-center">
            Masuk untuk mengakses skrining dan layanan pendampingan
          </p>
        </div>

        <form onSubmit={handleSubmit} className="doc-card p-6 pt-7 space-y-4">
          <div>
            <label htmlFor="idPengguna" className="block text-sm font-medium mb-1.5">
              NIK atau NIP
            </label>
            <input
              id="idPengguna"
              type="text"
              inputMode="numeric"
              required
              value={idPengguna}
              onChange={(e) => setIdPengguna(e.target.value.trim())}
              placeholder="16 digit NIK / 18 digit NIP"
              className="input-field font-mono"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5">
              Kata sandi
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
            />
          </div>

          {error && (
            <p className="text-sm text-risk-high bg-[#F7E8E5] border border-risk-high/30 rounded-seal px-3 py-2">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Memproses…' : 'Masuk'}
          </button>

          <p className="text-xs text-ink/40 text-center">
            Lupa kata sandi? Hubungi admin BKPSDM untuk direset.
          </p>
        </form>

        <p className="text-center text-sm text-ink/60 mt-5">
          Belum punya akun?{' '}
          <Link to="/register" className="text-seal-700 font-medium hover:underline">
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  )
}

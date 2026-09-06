import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, idToPseudoEmail } from '../lib/supabaseClient'
import { validateIdPengguna, detectIdType, validateWaNumber } from '../lib/validators'
import Seal from '../components/Seal'

const OPD_LIST = [
  'Sekretariat Daerah', 'BKPSDM', 'Dinas Pendidikan', 'Dinas Kesehatan',
  'Dinas Pekerjaan Umum', 'Dinas Sosial', 'Dinas Perhubungan', 'Bappeda',
  'BPKAD', 'Satpol PP', 'Kecamatan', 'Lainnya',
]

export default function Register() {
  const [form, setForm] = useState({
    idPengguna: '', nama: '', opd: OPD_LIST[0], jabatan: '', noWa: '', password: '', confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const jenis = detectIdType(form.idPengguna)
    if (!jenis) {
      setError('ID harus berupa NIK (16 digit) atau NIP (18 digit).')
      return
    }
    const validasi = validateIdPengguna(form.idPengguna, jenis)
    if (!validasi.valid) {
      setError(validasi.message)
      return
    }
    const validasiWa = validateWaNumber(form.noWa)
    if (!validasiWa.valid) {
      setError(validasiWa.message)
      return
    }
    if (form.password.length < 6) {
      setError('Kata sandi minimal 6 karakter.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.')
      return
    }

    setLoading(true)
    const email = idToPseudoEmail(form.idPengguna)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password: form.password,
    })

    if (signUpError) {
      setLoading(false)
      if (signUpError.message?.toLowerCase().includes('already registered')) {
        setError('ID ini sudah terdaftar. Silakan masuk atau gunakan ID lain.')
      } else {
        setError('Pendaftaran gagal: ' + signUpError.message)
      }
      return
    }

    const userId = data.user?.id
    if (userId) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        id_pengguna: form.idPengguna,
        jenis_id: jenis,
        nama: form.nama,
        opd: form.opd,
        jabatan: form.jabatan,
        no_wa: validasiWa.normalized,
        role: 'user',
      })
      if (profileError) {
        setLoading(false)
        setError('Akun dibuat tapi profil gagal disimpan: ' + profileError.message)
        return
      }
    }

    setLoading(false)
    navigate('/login')
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-8">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-7">
          <Seal size={48} />
          <h1 className="font-display text-2xl font-semibold text-seal-900 mt-3">Daftar Akun ASN</h1>
          <p className="text-sm text-ink/60 mt-1 text-center">
            Data Anda bersifat rahasia dan hanya digunakan untuk skrining internal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="doc-card p-6 pt-7 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">NIK atau NIP</label>
            <input
              type="text"
              inputMode="numeric"
              required
              value={form.idPengguna}
              onChange={(e) => update('idPengguna', e.target.value.trim())}
              placeholder="16 digit NIK / 18 digit NIP"
              className="input-field font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Nama lengkap</label>
            <input
              type="text"
              required
              value={form.nama}
              onChange={(e) => update('nama', e.target.value)}
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Unit kerja (OPD)</label>
              <select
                value={form.opd}
                onChange={(e) => update('opd', e.target.value)}
                className="input-field"
              >
                {OPD_LIST.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Jabatan</label>
              <input
                type="text"
                required
                value={form.jabatan}
                onChange={(e) => update('jabatan', e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Nomor WhatsApp aktif</label>
            <input
              type="text"
              inputMode="numeric"
              required
              value={form.noWa}
              onChange={(e) => update('noWa', e.target.value)}
              placeholder="08xxxxxxxxxx"
              className="input-field font-mono"
            />
            <p className="text-xs text-ink/40 mt-1">Dipakai untuk pengingat pengisian JAGAD CHECK bulanan.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Kata sandi</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Konfirmasi</label>
              <input
                type="password"
                required
                value={form.confirmPassword}
                onChange={(e) => update('confirmPassword', e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-risk-high bg-[#F7E8E5] border border-risk-high/30 rounded-seal px-3 py-2">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Mendaftarkan…' : 'Daftar'}
          </button>
        </form>

        <p className="text-center text-sm text-ink/60 mt-5">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-seal-700 font-medium hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  )
}

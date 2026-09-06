import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { validateWaNumber } from '../lib/validators'

export default function Profile() {
  const { profile, user, refreshProfile } = useAuth()
  const [nama, setNama] = useState(profile?.nama || '')
  const [jabatan, setJabatan] = useState(profile?.jabatan || '')
  const [noWa, setNoWa] = useState(profile?.no_wa ? '0' + profile.no_wa.slice(2) : '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [fotoError, setFotoError] = useState('')

  const [passwordBaru, setPasswordBaru] = useState('')
  const [passwordKonfirmasi, setPasswordKonfirmasi] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  async function simpan(e) {
    e.preventDefault()
    setError('')
    const validasiWa = validateWaNumber(noWa)
    if (!validasiWa.valid) {
      setError(validasiWa.message)
      return
    }
    setSaving(true)
    await supabase.from('profiles').update({ nama, jabatan, no_wa: validasiWa.normalized }).eq('id', profile.id)
    await refreshProfile()
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function uploadFoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoError('')

    if (!file.type.startsWith('image/')) {
      setFotoError('File harus berupa gambar (JPG, PNG, dll).')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setFotoError('Ukuran foto maksimal 2MB.')
      return
    }

    setUploadingFoto(true)
    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, cacheControl: '3600' })

    if (uploadError) {
      setUploadingFoto(false)
      setFotoError('Gagal mengunggah foto: ' + uploadError.message)
      return
    }

    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path)
    const urlDenganVersi = `${publicUrlData.publicUrl}?t=${Date.now()}` // hindari cache foto lama

    await supabase.from('profiles').update({ avatar_url: urlDenganVersi }).eq('id', profile.id)
    await refreshProfile()
    setUploadingFoto(false)
  }

  async function ubahPassword(e) {
    e.preventDefault()
    setPasswordError('')
    if (passwordBaru.length < 6) {
      setPasswordError('Kata sandi baru minimal 6 karakter.')
      return
    }
    if (passwordBaru !== passwordKonfirmasi) {
      setPasswordError('Konfirmasi kata sandi tidak cocok.')
      return
    }
    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: passwordBaru })
    setSavingPassword(false)
    if (error) {
      setPasswordError('Gagal mengubah kata sandi: ' + error.message)
      return
    }
    setPasswordBaru('')
    setPasswordKonfirmasi('')
    setPasswordSaved(true)
    setTimeout(() => setPasswordSaved(false), 2500)
  }

  if (!profile) return null

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <p className="text-sm text-bronze-600 font-mono">Profil</p>
        <h1 className="font-display text-2xl font-semibold text-seal-900 mt-1">Data Diri</h1>
      </div>

      <div className="doc-card p-6 flex flex-col items-center">
        <div className="relative">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Foto profil"
              className="w-24 h-24 rounded-full object-cover border-2 border-seal-200"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-seal-50 border-2 border-seal-200 flex items-center justify-center">
              <span className="font-display text-2xl text-seal-700">
                {profile.nama?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
          )}
        </div>

        <label className="btn-secondary text-sm mt-4 !py-1.5 !px-4 cursor-pointer">
          {uploadingFoto ? 'Mengunggah…' : 'Ganti Foto'}
          <input type="file" accept="image/*" onChange={uploadFoto} disabled={uploadingFoto} className="hidden" />
        </label>
        <p className="text-xs text-ink/40 mt-2">JPG/PNG, maksimal 2MB</p>
        {fotoError && <p className="text-sm text-risk-high mt-2">{fotoError}</p>}
      </div>

      <form onSubmit={simpan} className="doc-card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">{profile.jenis_id}</label>
          <input value={profile.id_pengguna} disabled className="input-field font-mono bg-paperDark opacity-70" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Nama lengkap</label>
          <input value={nama} onChange={(e) => setNama(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Unit kerja (OPD)</label>
          <input value={profile.opd} disabled className="input-field bg-paperDark opacity-70" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Jabatan</label>
          <input value={jabatan} onChange={(e) => setJabatan(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Nomor WhatsApp aktif</label>
          <input value={noWa} onChange={(e) => setNoWa(e.target.value)} placeholder="08xxxxxxxxxx" className="input-field font-mono" />
        </div>

        {error && <p className="text-sm text-risk-high">{error}</p>}

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? 'Menyimpan…' : saved ? 'Tersimpan ✓' : 'Simpan perubahan'}
        </button>
      </form>

      <form onSubmit={ubahPassword} className="doc-card p-6 space-y-4">
        <h2 className="font-display font-semibold text-seal-800">Ubah Kata Sandi</h2>
        <div>
          <label className="block text-sm font-medium mb-1.5">Kata sandi baru</label>
          <input
            type="password"
            value={passwordBaru}
            onChange={(e) => setPasswordBaru(e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Konfirmasi kata sandi baru</label>
          <input
            type="password"
            value={passwordKonfirmasi}
            onChange={(e) => setPasswordKonfirmasi(e.target.value)}
            className="input-field"
          />
        </div>

        {passwordError && <p className="text-sm text-risk-high">{passwordError}</p>}

        <button type="submit" disabled={savingPassword} className="btn-secondary w-full">
          {savingPassword ? 'Menyimpan…' : passwordSaved ? 'Kata sandi diperbarui ✓' : 'Ubah Kata Sandi'}
        </button>

        <p className="text-xs text-ink/40 text-center">
          Lupa kata sandi lama dan tidak bisa login sama sekali? Hubungi admin BKPSDM untuk direset.
        </p>
      </form>
    </div>
  )
}

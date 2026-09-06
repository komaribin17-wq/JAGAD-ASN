import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center">
      <p className="font-display text-4xl font-semibold text-seal-900">404</p>
      <p className="text-sm text-ink/60 mt-2 mb-5">Halaman yang Anda cari tidak ditemukan.</p>
      <Link to="/" className="btn-primary text-sm !py-1.5 !px-4">Kembali ke beranda</Link>
    </div>
  )
}

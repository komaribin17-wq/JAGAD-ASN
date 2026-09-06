// Validasi format NIK (16 digit, tanggal lahir tertanam pada digit ke-7 s.d. 12)
// Digit tanggal ditambah 40 untuk perempuan (aturan Dukcapil).
export function validateNIK(nik) {
  if (!/^\d{16}$/.test(nik)) {
    return { valid: false, message: 'NIK harus terdiri dari 16 digit angka.' }
  }
  let tanggal = parseInt(nik.slice(6, 8), 10)
  const bulan = parseInt(nik.slice(8, 10), 10)
  const tahun = parseInt(nik.slice(10, 12), 10)
  const isPerempuan = tanggal > 40
  if (isPerempuan) tanggal -= 40

  if (tanggal < 1 || tanggal > 31) {
    return { valid: false, message: 'Tanggal lahir pada NIK tidak valid.' }
  }
  if (bulan < 1 || bulan > 12) {
    return { valid: false, message: 'Bulan lahir pada NIK tidak valid.' }
  }
  return { valid: true, tanggal, bulan, tahun, gender: isPerempuan ? 'P' : 'L' }
}

// Validasi format NIP (18 digit): YYYYMMDD (tgl lahir) + YYYYMM (TMT PNS) + kode gender (1/2) + nomor urut (3 digit)
export function validateNIP(nip) {
  if (!/^\d{18}$/.test(nip)) {
    return { valid: false, message: 'NIP harus terdiri dari 18 digit angka.' }
  }
  const tahunLahir = parseInt(nip.slice(0, 4), 10)
  const bulanLahir = parseInt(nip.slice(4, 6), 10)
  const tglLahir = parseInt(nip.slice(6, 8), 10)
  const genderCode = nip[14]

  if (bulanLahir < 1 || bulanLahir > 12 || tglLahir < 1 || tglLahir > 31) {
    return { valid: false, message: 'Tanggal lahir pada NIP tidak valid.' }
  }
  if (tahunLahir < 1940 || tahunLahir > new Date().getFullYear()) {
    return { valid: false, message: 'Tahun lahir pada NIP tidak wajar.' }
  }
  if (genderCode !== '1' && genderCode !== '2') {
    return { valid: false, message: 'Kode jenis kelamin pada NIP (digit ke-15) harus 1 atau 2.' }
  }
  return { valid: true, gender: genderCode === '1' ? 'L' : 'P' }
}

export function validateIdPengguna(id, jenis) {
  if (jenis === 'NIK') return validateNIK(id)
  if (jenis === 'NIP') return validateNIP(id)
  return { valid: false, message: 'Jenis ID tidak dikenali.' }
}

export function detectIdType(id) {
  if (/^\d{16}$/.test(id)) return 'NIK'
  if (/^\d{18}$/.test(id)) return 'NIP'
  return null
}

// Normalisasi nomor WA Indonesia ke format internasional tanpa '+' (dibutuhkan Meta WhatsApp API)
// Menerima: 08xxxxxxxxxx, +628xxxxxxxxxx, 628xxxxxxxxxx
export function normalizeWaNumber(input) {
  const digits = input.replace(/[^\d]/g, '')
  if (digits.startsWith('0')) return '62' + digits.slice(1)
  if (digits.startsWith('62')) return digits
  return null
}

export function validateWaNumber(input) {
  const normalized = normalizeWaNumber(input || '')
  if (!normalized || normalized.length < 10 || normalized.length > 15) {
    return { valid: false, message: 'Nomor WhatsApp tidak valid. Gunakan format 08xxxxxxxxxx.' }
  }
  return { valid: true, normalized }
}

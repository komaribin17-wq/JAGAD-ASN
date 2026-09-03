import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Wajib untuk GitHub Pages project site (https://<user>.github.io/JAGAD-ASN/):
  // tanpa 'base' ini, semua file JS/CSS akan dicari di root domain (404) dan
  // halaman tampil KOSONG/PUTIH. Sesuaikan nama di antara garis miring dengan
  // nama repo GitHub Anda persis (case-sensitive).
  base: '/JAGAD-ASN/',
  plugins: [react()],
})
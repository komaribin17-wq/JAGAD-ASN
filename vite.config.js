import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Ganti base di bawah ini sesuai nama repo GitHub Pages Anda,
// contoh: '/JAGAD-ASN/'  (harus diawali dan diakhiri tanda '/')
export default defineConfig({
  plugins: [react()],
  base: '/JAGAD-ASN/',
})

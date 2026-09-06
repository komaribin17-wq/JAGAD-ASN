const CONFIG = {
  rendah: { label: 'Risiko Rendah', bg: '#EAF1EC', text: '#3F7D4F', border: '#3F7D4F' },
  sedang: { label: 'Risiko Sedang', bg: '#FBF2E1', text: '#C08A2E', border: '#C08A2E' },
  tinggi: { label: 'Risiko Tinggi', bg: '#F7E8E5', text: '#A13A2E', border: '#A13A2E' },
}

export default function RiskBadge({ level, className = '' }) {
  const cfg = CONFIG[level] || CONFIG.rendah
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold font-mono ${className}`}
      style={{ backgroundColor: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.text }} />
      {cfg.label}
    </span>
  )
}

export function scoreToLevel(score) {
  // score 0-100, semakin tinggi semakin berisiko
  if (score >= 66) return 'tinggi'
  if (score >= 33) return 'sedang'
  return 'rendah'
}

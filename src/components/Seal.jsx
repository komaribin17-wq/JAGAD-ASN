export default function Seal({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="#1C4830" />
      <circle cx="32" cy="32" r="24" fill="none" stroke="#C7A455" strokeWidth="2" />
      <path d="M32 16 L44 22 V32 C44 42 38 48 32 50 C26 48 20 42 20 32 V22 Z" fill="#EDEAE0" />
      <path
        d="M25 32 L30 38 L40 25"
        fill="none"
        stroke="#1C4830"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

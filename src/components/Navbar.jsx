import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Seal from './Seal'

const LINKS = [
  { to: '/', label: 'Beranda' },
  { to: '/check', label: 'JAGAD CHECK' },
  { to: '/edu', label: 'JAGAD EDU' },
  { to: '/trend', label: 'JAGAD TREND' },
  { to: '/care', label: 'JAGAD CARE' },
]

export default function Navbar() {
  const { session, profile, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="border-b border-line bg-paper sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-5 flex items-center justify-between h-16">
        <NavLink to="/" className="flex items-center gap-2.5">
          <Seal size={32} />
          <span className="font-display text-xl font-semibold text-seal-900 tracking-tight">
            JAGAD ASN
          </span>
        </NavLink>

        {session && (
          <nav className="hidden md:flex items-center gap-1">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 text-sm font-medium rounded-seal transition-colors ${
                    isActive ? 'text-seal-700 bg-seal-50' : 'text-ink/70 hover:text-seal-700'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `px-3 py-2 text-sm font-medium rounded-seal transition-colors ${
                    isActive ? 'text-bronze-700 bg-bronze-200/40' : 'text-bronze-600 hover:text-bronze-700'
                  }`
                }
              >
                Admin
              </NavLink>
            )}
          </nav>
        )}

        <div className="flex items-center gap-3">
          {session ? (
            <>
              <NavLink to="/profile" className="hidden sm:flex items-center gap-2 text-sm text-ink/70 hover:text-seal-700 font-medium">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover border border-seal-200" />
                ) : (
                  <span className="w-7 h-7 rounded-full bg-seal-50 border border-seal-200 flex items-center justify-center text-xs font-display text-seal-700">
                    {profile?.nama?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                )}
                {profile?.nama || 'Profil'}
              </NavLink>
              <button onClick={handleLogout} className="btn-secondary !py-1.5 !px-3 text-sm">
                Keluar
              </button>
            </>
          ) : (
            <NavLink to="/login" className="btn-primary !py-1.5 !px-4 text-sm">
              Masuk
            </NavLink>
          )}
        </div>
      </div>

      {session && (
        <nav className="md:hidden flex overflow-x-auto gap-1 px-5 pb-2">
          {LINKS.concat(isAdmin ? [{ to: '/admin', label: 'Admin' }] : []).map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap ${
                  isActive ? 'bg-seal-700 text-paper' : 'bg-white border border-line text-ink/70'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}

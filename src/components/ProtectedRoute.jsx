import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!session) return <Navigate to="/login" replace />
  return children
}

export function AdminRoute({ children }) {
  const { session, isAdmin, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!session) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper">
      <p className="font-mono text-sm text-seal-700">Memuat…</p>
    </div>
  )
}

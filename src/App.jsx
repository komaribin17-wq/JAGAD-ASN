import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import JagadCheck from './pages/JagadCheck'
import JagadEdu from './pages/JagadEdu'
import JagadTrend from './pages/JagadTrend'
import JagadCare from './pages/JagadCare'
import Profile from './pages/Profile'
import AdminDashboard from './pages/AdminDashboard'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <div className="min-h-screen bg-paper text-ink font-sans">
      <Navbar />
      <main className="max-w-6xl mx-auto px-5 py-8">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/check" element={<ProtectedRoute><JagadCheck /></ProtectedRoute>} />
          <Route path="/edu" element={<ProtectedRoute><JagadEdu /></ProtectedRoute>} />
          <Route path="/trend" element={<ProtectedRoute><JagadTrend /></ProtectedRoute>} />
          <Route path="/care" element={<ProtectedRoute><JagadCare /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="border-t border-line py-6 mt-12">
        <p className="max-w-6xl mx-auto px-5 text-xs text-ink/50 font-mono">
          JAGAD ASN — Prototipe skrining risiko digital & judi online untuk ASN. Data bersifat rahasia.
        </p>
      </footer>
    </div>
  )
}

import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import Landing        from './pages/Landing'
import Login          from './pages/Login'
import Signup         from './pages/Signup'
import Dashboard      from './pages/Dashboard'
import Search         from './pages/Search'
import Upload         from './pages/Upload'
import Profile        from './pages/Profile'
import AdminDashboard from './pages/AdminDashboard'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/"        element={<Landing />} />
      <Route path="/login"   element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/signup"  element={user ? <Navigate to="/dashboard" /> : <Signup />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/search"    element={<Search />} />
        <Route path="/upload"    element={<Upload />} />
        <Route path="/profile"   element={<Profile />} />
      </Route>

      <Route element={<ProtectedRoute adminOnly />}>
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

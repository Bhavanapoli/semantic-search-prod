import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Upload, LayoutDashboard, User, LogOut, Shield, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/search',    icon: Search,          label: 'Search' },
  { to: '/upload',    icon: Upload,          label: 'Upload' },
  { to: '/profile',   icon: User,            label: 'Profile' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out')
    navigate('/')
  }

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 border-b border-white/5 bg-dark-50/80 backdrop-blur-xl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 font-semibold text-white">
          <span className="p-1.5 rounded-lg bg-gradient-to-br from-primary-600 to-accent-600">
            <Sparkles size={16} />
          </span>
          <span className="hidden sm:block">SemanticSearch</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${active
                    ? 'bg-primary-600/20 text-primary-300'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <Icon size={16} />
                <span className="hidden sm:block">{label}</span>
              </Link>
            )
          })}
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${location.pathname === '/admin'
                  ? 'bg-amber-600/20 text-amber-300'
                  : 'text-gray-400 hover:text-amber-300 hover:bg-amber-600/10'
                }`}
            >
              <Shield size={16} />
              <span className="hidden sm:block">Admin</span>
            </Link>
          )}
        </div>

        {/* User + logout */}
        <div className="flex items-center gap-3">
          <span className="hidden md:block text-sm text-gray-400">{user?.username}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </motion.nav>
  )
}

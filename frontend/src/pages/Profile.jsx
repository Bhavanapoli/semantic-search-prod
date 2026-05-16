import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Search, Upload, Calendar, BookOpen } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, refreshUser } = useAuth()
  const [stats, setStats]     = useState(null)
  const [papers, setPapers]   = useState([])
  const [username, setUsername] = useState(user?.username || '')
  const [editing, setEditing]   = useState(false)
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    const load = async () => {
      const [s, p] = await Promise.allSettled([
        api.get('/analytics/users/stats'),
        api.get('/users/papers'),
      ])
      if (s.status === 'fulfilled') setStats(s.value.data)
      if (p.status === 'fulfilled') setPapers(p.value.data.papers)
    }
    load()
  }, [])

  const saveUsername = async () => {
    if (!username.trim() || username === user.username) { setEditing(false); return }
    setSaving(true)
    try {
      await api.patch('/users/profile', { username })
      await refreshUser()
      toast.success('Username updated')
      setEditing(false)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const STAT_ITEMS = [
    { icon: Search,   label: 'Searches',     value: stats?.search_count ?? '—' },
    { icon: Upload,   label: 'Uploads',      value: stats?.upload_count ?? '—' },
    { icon: Calendar, label: 'Member since', value: stats?.member_since ? new Date(stats.member_since).toLocaleDateString() : '—' },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-6">Profile</h1>

        {/* User info */}
        <div className="card flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600/40 to-accent-600/30 flex items-center justify-center flex-shrink-0">
            <User size={28} className="text-primary-200" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              {editing ? (
                <input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="input-field py-1.5 text-lg font-semibold w-48"
                  autoFocus
                />
              ) : (
                <h2 className="text-xl font-semibold text-white">{user?.username}</h2>
              )}
              <span className="tag">{user?.role}</span>
            </div>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <div className="flex gap-2 mt-3">
              {editing ? (
                <>
                  <button onClick={saveUsername} disabled={saving} className="btn-primary text-xs py-1.5 px-3">
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button onClick={() => { setEditing(false); setUsername(user.username) }} className="btn-ghost text-xs py-1.5 px-3">Cancel</button>
                </>
              ) : (
                <button onClick={() => setEditing(true)} className="btn-ghost text-xs py-1.5 px-3">Edit username</button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {STAT_ITEMS.map(({ icon: Icon, label, value }) => (
            <div key={label} className="card text-center">
              <Icon size={18} className="text-primary-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Recent queries */}
        {stats?.recent_queries?.length > 0 && (
          <div className="card">
            <h3 className="font-semibold text-white mb-4 text-sm flex items-center gap-2">
              <Search size={14} className="text-primary-400" /> Recent Searches
            </h3>
            <div className="space-y-2">
              {stats.recent_queries.map((q, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-white/5 last:border-0">
                  <span className="text-gray-400 truncate mr-4">{q.query}</span>
                  <span className="text-xs text-gray-600 flex-shrink-0">{new Date(q.timestamp).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Uploaded papers */}
        <div className="card">
          <h3 className="font-semibold text-white mb-4 text-sm flex items-center gap-2">
            <BookOpen size={14} className="text-accent-400" /> Uploaded Papers ({papers.length})
          </h3>
          {papers.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-4">No papers uploaded yet.</p>
          ) : (
            <div className="space-y-3">
              {papers.map((p, i) => (
                <div key={i} className="p-3 rounded-xl bg-dark-300/50 text-sm">
                  <p className="font-medium text-white line-clamp-1">{p.title}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{p.authors?.join(', ')}</p>
                  <p className="text-gray-600 text-xs mt-0.5">{new Date(p.uploaded_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

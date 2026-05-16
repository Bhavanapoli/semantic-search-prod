import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, FileText, Search, TrendingUp, Shield, Activity } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import api from '../services/api'

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null)
  const [trend, setTrend]     = useState([])
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [s, t, u] = await Promise.all([
          api.get('/analytics/summary'),
          api.get('/analytics/query-trend?days=14'),
          api.get('/users/all'),
        ])
        setSummary(s.data)
        setTrend(t.data.trend)
        setUsers(u.data.users)
      } catch {}
      finally { setLoading(false) }
    }
    load()
  }, [])

  const STAT_CARDS = [
    { icon: Users,    label: 'Total Users',   value: summary?.total_users,   color: 'text-blue-400',   bg: 'bg-blue-600/10',   border: 'border-blue-500/20' },
    { icon: FileText, label: 'Total Papers',  value: summary?.total_papers,  color: 'text-green-400',  bg: 'bg-green-600/10',  border: 'border-green-500/20' },
    { icon: Search,   label: 'Total Queries', value: summary?.total_queries, color: 'text-primary-400', bg: 'bg-primary-600/10',border: 'border-primary-500/20' },
    { icon: Activity, label: 'Today Queries', value: summary?.queries_today, color: 'text-accent-400', bg: 'bg-accent-600/10', border: 'border-accent-500/20' },
  ]

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary-400/30 border-t-primary-400 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-2">
          <Shield size={20} className="text-amber-400" />
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        </div>
        <p className="text-gray-500 text-sm">Platform analytics and management</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ icon: Icon, label, value, color, bg, border }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`rounded-xl border ${border} ${bg} p-5`}
          >
            <Icon size={20} className={`${color} mb-3`} />
            <div className="text-3xl font-bold text-white">{value ?? '—'}</div>
            <div className="text-sm text-gray-500 mt-1">{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Two col */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Query trend chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 card"
        >
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={16} className="text-primary-400" />
            <h2 className="font-semibold text-white text-sm">Query Activity (14 days)</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trend} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
              <defs>
                <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: '#9ca3af' }}
                itemStyle={{ color: '#a78bfa' }}
              />
              <Area type="monotone" dataKey="queries" stroke="#6366f1" strokeWidth={2} fill="url(#cg)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top queries */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center gap-2 mb-4">
            <Search size={16} className="text-accent-400" />
            <h2 className="font-semibold text-white text-sm">Top Queries</h2>
          </div>
          <div className="space-y-2">
            {summary?.top_queries?.slice(0, 8).map((q, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="text-gray-600 w-4 text-right">{i + 1}</span>
                <span className="text-gray-400 flex-1 truncate">{q.query}</span>
                <span className="text-primary-300 font-mono flex-shrink-0">{q.count}</span>
              </div>
            ))}
            {!summary?.top_queries?.length && <p className="text-gray-600 text-sm text-center py-4">No queries yet</p>}
          </div>
        </motion.div>
      </div>

      {/* Users table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <div className="flex items-center gap-2 mb-6">
          <Users size={16} className="text-blue-400" />
          <h2 className="font-semibold text-white text-sm">Users ({users.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Username', 'Email', 'Role', 'Searches', 'Uploads', 'Joined'].map(h => (
                  <th key={h} className="text-left text-xs text-gray-600 font-medium pb-3 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                  <td className="py-3 pr-4 text-white font-medium">{u.username}</td>
                  <td className="py-3 pr-4 text-gray-500">{u.email}</td>
                  <td className="py-3 pr-4">
                    <span className={`tag ${u.role === 'admin' ? 'bg-amber-600/20 text-amber-300 border-amber-500/20' : ''}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-gray-500 font-mono">{u.search_count ?? 0}</td>
                  <td className="py-3 pr-4 text-gray-500 font-mono">{u.upload_count ?? 0}</td>
                  <td className="py-3 text-gray-600 text-xs">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
              {!users.length && (
                <tr><td colSpan={6} className="text-center text-gray-600 py-8">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Recent uploads */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card"
      >
        <div className="flex items-center gap-2 mb-4">
          <FileText size={16} className="text-green-400" />
          <h2 className="font-semibold text-white text-sm">Recent Uploads</h2>
        </div>
        <div className="space-y-2">
          {summary?.recent_uploads?.map((u, i) => (
            <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-white/5 last:border-0">
              <span className="text-gray-400 truncate mr-4">{u.filename}</span>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`tag text-xs ${u.status === 'completed' ? 'bg-green-600/20 text-green-300 border-green-500/20' : u.status === 'failed' ? 'bg-red-600/20 text-red-300 border-red-500/20' : ''}`}>
                  {u.status}
                </span>
                <span className="text-gray-600 text-xs">{u.uploaded_at ? new Date(u.uploaded_at).toLocaleDateString() : ''}</span>
              </div>
            </div>
          ))}
          {!summary?.recent_uploads?.length && <p className="text-gray-600 text-sm text-center py-4">No uploads yet</p>}
        </div>
      </motion.div>
    </div>
  )
}

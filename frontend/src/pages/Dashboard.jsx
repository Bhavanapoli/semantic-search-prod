import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Upload, BookOpen, TrendingUp, Clock, ArrowRight, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const EXAMPLE_QUERIES = [
  'How does BERT learn contextual embeddings?',
  'Transformer attention mechanisms explained',
  'Gene expression classification with ML',
  'Protein structure prediction accuracy',
]

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [q, setQ]               = useState('')
  const [stats, setStats]       = useState(null)
  const [history, setHistory]   = useState([])
  const [suggestions, setSugg]  = useState(EXAMPLE_QUERIES)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, histRes, suggRes] = await Promise.allSettled([
          api.get('/analytics/users/stats'),
          api.get('/search/history?limit=5'),
          api.get('/search/suggestions'),
        ])
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data)
        if (histRes.status  === 'fulfilled') setHistory(histRes.value.data.history)
        if (suggRes.status  === 'fulfilled' && suggRes.value.data.suggestions.length)
          setSugg(suggRes.value.data.suggestions)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSearch = (query = q) => {
    if (query.trim()) navigate('/search', { state: { query: query.trim() } })
  }

  const STAT_CARDS = [
    { icon: Search,   label: 'Searches',  value: stats?.search_count ?? '—', color: 'from-primary-600/20 to-primary-600/5',  border: 'border-primary-500/20' },
    { icon: Upload,   label: 'Uploads',   value: stats?.upload_count ?? '—', color: 'from-accent-600/20 to-accent-600/5',    border: 'border-accent-500/20' },
    { icon: BookOpen, label: 'Days active', value: stats?.member_since ? Math.max(1, Math.floor((Date.now() - new Date(stats.member_since)) / 86400000)) : '—', color: 'from-teal-600/20 to-teal-600/5', border: 'border-teal-500/20' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">
          Good to see you, <span className="text-primary-300">{user?.username}</span> 👋
        </h1>
        <p className="text-gray-500 mt-1 text-sm">What would you like to research today?</p>
      </motion.div>

      {/* Search bar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <form onSubmit={e => { e.preventDefault(); handleSearch() }}
          className="glass p-3 flex items-center gap-3">
          <Search size={20} className="text-primary-400 ml-2 flex-shrink-0" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Ask anything about research papers…"
            className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none text-sm"
          />
          <button type="submit" className="btn-primary text-sm py-2 px-4 flex-shrink-0">
            Search <ArrowRight size={14} />
          </button>
        </form>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {STAT_CARDS.map(({ icon: Icon, label, value, color, border }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className={`relative overflow-hidden rounded-xl border ${border} bg-gradient-to-br ${color} p-5`}
          >
            <Icon size={20} className="text-gray-400 mb-3" />
            <div className="text-3xl font-bold text-white">{loading ? '…' : value}</div>
            <div className="text-sm text-gray-500 mt-1">{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Two column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Suggestions */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="card">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-accent-400" />
            <h2 className="font-semibold text-white text-sm">Try these searches</h2>
          </div>
          <div className="space-y-2">
            {suggestions.slice(0, 4).map((s, i) => (
              <button
                key={i}
                onClick={() => handleSearch(s)}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all flex items-center justify-between group"
              >
                <span className="line-clamp-1">{s}</span>
                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 flex-shrink-0 ml-2" />
              </button>
            ))}
          </div>
        </motion.div>

        {/* History */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="card">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-primary-400" />
            <h2 className="font-semibold text-white text-sm">Recent searches</h2>
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-gray-600 text-center py-6">No searches yet. Try one above!</p>
          ) : (
            <div className="space-y-2">
              {history.map((h, i) => (
                <button
                  key={i}
                  onClick={() => handleSearch(h.query)}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all flex items-center justify-between group"
                >
                  <span className="line-clamp-1">{h.query}</span>
                  <span className="text-xs text-gray-600 flex-shrink-0 ml-2">{h.result_count} results</span>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="grid grid-cols-2 gap-4">
        <button onClick={() => navigate('/search')} className="card flex items-center gap-4 hover:border-primary-500/30 hover:-translate-y-0.5 transition-all group text-left">
          <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center">
            <Search size={20} className="text-primary-300" />
          </div>
          <div>
            <p className="font-medium text-white">Semantic Search</p>
            <p className="text-xs text-gray-500">Find papers by meaning</p>
          </div>
        </button>
        <button onClick={() => navigate('/upload')} className="card flex items-center gap-4 hover:border-accent-500/30 hover:-translate-y-0.5 transition-all group text-left">
          <div className="w-10 h-10 rounded-xl bg-accent-600/20 flex items-center justify-center">
            <Upload size={20} className="text-accent-300" />
          </div>
          <div>
            <p className="font-medium text-white">Upload PDF</p>
            <p className="text-xs text-gray-500">Index a new paper</p>
          </div>
        </button>
      </motion.div>
    </div>
  )
}

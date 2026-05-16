import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search as SearchIcon, Layers, BookOpen, AlertCircle } from 'lucide-react'
import api from '../services/api'
import PaperCard from '../components/PaperCard'
import SectionCard from '../components/SectionCard'
import LoadingState from '../components/LoadingState'

export default function Search() {
  const location = useLocation()
  const [q, setQ]               = useState(location.state?.query || '')
  const [results, setResults]   = useState(null)
  const [loading, setLoading]   = useState(false)
  const [loadStep, setLoadStep] = useState(0)
  const [error, setError]       = useState('')
  const inputRef                = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    if (location.state?.query) runSearch(location.state.query)
  }, [])

  const runSearch = async (query = q) => {
    if (!query.trim() || loading) return
    setLoading(true)
    setError('')
    setResults(null)
    setLoadStep(0)

    // Simulate steps for UX
    const steps = [0, 1, 2, 3]
    const timers = steps.map(s => setTimeout(() => setLoadStep(s), s * 600))

    try {
      const { data } = await api.post('/search', { query: query.trim() })
      setResults(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Search failed. Make sure the index is ready.')
    } finally {
      timers.forEach(clearTimeout)
      setLoading(false)
    }
  }

  const handleSubmit = e => {
    e.preventDefault()
    runSearch()
  }

  const isEmpty = results && results.sections.length === 0 && results.papers.length === 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Search bar */}
      <motion.form
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="glass p-3 flex items-center gap-3 mb-8 sticky top-20 z-30"
      >
        <SearchIcon size={20} className="text-primary-400 ml-2 flex-shrink-0" />
        <input
          ref={inputRef}
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Ask a research question in plain English…"
          className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none"
        />
        <button
          type="submit"
          disabled={loading || !q.trim()}
          className="btn-primary text-sm py-2 px-4 flex-shrink-0 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : 'Search'}
        </button>
      </motion.form>

      {/* Loading */}
      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoadingState step={loadStep} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/20 bg-red-600/10 text-red-300 text-sm mb-6">
          <AlertCircle size={16} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* No results */}
      {!loading && isEmpty && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4 opacity-30">◌</div>
          <p className="text-gray-400">No results found. Try rephrasing in more specific academic terms.</p>
        </div>
      )}

      {/* Results */}
      {!loading && results && !isEmpty && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          {/* Result summary */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              <span className="text-white font-medium">{results.result_count}</span> results for{' '}
              <em className="text-primary-300 not-italic">"{results.query}"</em>
            </p>
          </div>

          {results.answer && (
            <div className="rounded-xl border border-primary-500/20 bg-primary-600/8 p-5">
              <div className="flex items-center gap-2 mb-2">
                <SearchIcon size={14} className="text-primary-300" />
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Answer</h2>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{results.answer}</p>
            </div>
          )}

          {/* Sections */}
          {results.sections.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Layers size={16} className="text-accent-400" />
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Matching Sections</h2>
              </div>
              {results.sections.map((s, i) => (
                <SectionCard key={i} section={s} />
              ))}
            </div>
          )}

          {/* Papers */}
          {results.papers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen size={16} className="text-primary-400" />
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Relevant Papers</h2>
              </div>
              {results.papers.map((p, i) => (
                <PaperCard key={i} paper={p} index={i} />
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Placeholder */}
      {!loading && !results && !error && (
        <div className="text-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600/30 to-accent-600/20 flex items-center justify-center mx-auto mb-4">
            <SearchIcon size={28} className="text-primary-300" />
          </div>
          <p className="text-gray-500 text-lg">Enter a research question above to begin</p>
          <p className="text-gray-600 text-sm mt-2">Try: "How do attention mechanisms work in transformers?"</p>
        </div>
      )}
    </div>
  )
}

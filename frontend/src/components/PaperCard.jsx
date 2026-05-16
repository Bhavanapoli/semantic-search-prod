import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, BookOpen, Users } from 'lucide-react'

export default function PaperCard({ paper, index }) {
  const [expanded, setExpanded] = useState(false)
  const score = Math.min(1, Math.max(0, paper.score || 0))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="card mb-4 group cursor-pointer"
      onClick={() => setExpanded(e => !e)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary-600/20 text-primary-300 text-sm font-mono flex items-center justify-center">
            {paper.rank}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white leading-tight line-clamp-2 group-hover:text-primary-300 transition-colors">
              {paper.title}
            </h3>
            {paper.authors && (
              <p className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <Users size={12} /> {paper.authors}
              </p>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 flex flex-col items-end gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono text-primary-300">{(score * 100).toFixed(0)}%</span>
            <ChevronDown
              size={16}
              className={`text-gray-500 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
            />
          </div>
          <div className="w-20 h-1 bg-dark-400 rounded-full overflow-hidden">
            <div
              className="score-bar h-full rounded-full transition-all duration-700"
              style={{ width: `${score * 100}%` }}
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2 text-xs text-primary-400 mb-2">
                <BookOpen size={12} /> Summary
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">{paper.summary}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

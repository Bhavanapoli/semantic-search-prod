import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, ChevronDown, ChevronUp } from 'lucide-react'

export default function SectionCard({ section }) {
  const [expanded, setExpanded] = useState(false)
  const score = Math.min(1, Math.max(0, section.score || 0))

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={() => setExpanded(e => !e)}
      className="relative overflow-hidden rounded-xl border border-accent-500/30 bg-gradient-to-br from-accent-600/10 to-transparent p-5 mb-4 cursor-pointer hover:from-accent-600/20"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-accent-400 to-primary-500 rounded-l-xl" />
      <div className="pl-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-accent-400" />
            <span className="text-xs font-mono text-accent-400 uppercase tracking-wider">
              {section.section_name}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono text-accent-300">{(score * 100).toFixed(0)}% match</span>
            <div className="w-16 h-1 bg-dark-400 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent-500 to-primary-500 transition-all duration-700"
                style={{ width: `${score * 100}%` }}
              />
            </div>
            {expanded ? <ChevronUp size={14} className="text-gray-500"/> : <ChevronDown size={14} className="text-gray-500"/>}
          </div>
        </div>
        <h4 className="font-medium text-white mb-2">{section.title}</h4>
        <p className={`text-sm text-gray-400 leading-relaxed whitespace-pre-wrap ${expanded ? '' : 'line-clamp-4'}`}>{section.text}</p>
      </div>
    </motion.div>
  )
}

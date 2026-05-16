import { motion } from 'framer-motion'

const DOTS = [0, 0.2, 0.4]
const STEPS = [
  'Understanding your query…',
  'Encoding semantic vectors…',
  'Scanning knowledge base…',
  'Ranking results…',
]

export default function LoadingState({ step = 0 }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-8">
      {/* Animated orb */}
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-600 to-accent-600 opacity-20 animate-pulse-slow" />
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-primary-600 to-accent-600 opacity-40 animate-pulse" />
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
          <div className="flex gap-1">
            {DOTS.map((delay, i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-white"
                animate={{ y: [-4, 4, -4] }}
                transition={{ repeat: Infinity, duration: 0.8, delay, ease: 'easeInOut' }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="flex flex-col items-center gap-2">
        {STEPS.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: i <= step ? 1 : 0.2, x: 0 }}
            transition={{ delay: i * 0.4 }}
            className={`flex items-center gap-2 text-sm ${i <= step ? 'text-primary-300' : 'text-gray-600'}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${i <= step ? 'bg-primary-400' : 'bg-gray-600'}`} />
            {s}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

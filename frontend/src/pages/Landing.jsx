import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, Search, Upload, BarChart3, ArrowRight, Brain, Zap, Shield } from 'lucide-react'

const FEATURES = [
  { icon: Brain,    title: 'Semantic Understanding', desc: 'Finds papers by meaning, not keywords. Ask in plain English.' },
  { icon: Zap,      title: 'Lightning Fast',         desc: 'FAISS vector search returns results in milliseconds.' },
  { icon: Upload,   title: 'Upload & Index',          desc: 'Upload any PDF and instantly make it searchable.' },
  { icon: Shield,   title: 'Secure & Private',        desc: 'JWT auth, encrypted passwords, your data stays yours.' },
  { icon: BarChart3,title: 'Analytics',               desc: 'Track search trends and most explored research topics.' },
  { icon: Search,   title: 'Section-Level Results',   desc: 'Pinpoints the exact section of a paper that answers your query.' },
]

const fadeUp = { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 } }

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 bg-dark-50/60 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-2 font-semibold text-white">
          <span className="p-1.5 rounded-lg bg-gradient-to-br from-primary-600 to-accent-600">
            <Sparkles size={16} />
          </span>
          SemanticSearch AI
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login"  className="btn-ghost text-sm py-2 px-4">Log in</Link>
          <Link to="/signup" className="btn-primary text-sm py-2 px-4">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20 overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary-600/10 blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-accent-600/10 blur-3xl" />
        </div>

        <motion.div
          variants={fadeUp} initial="initial" animate="animate"
          transition={{ duration: 0.6 }}
          className="relative text-center max-w-4xl"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border border-primary-500/30 bg-primary-600/10 text-primary-300 mb-8"
          >
            <Sparkles size={12} />
            Powered by FAISS + Sentence Transformers
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-tight">
            Find Research Papers
            <span className="block bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
              By Meaning
            </span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Stop searching for exact keywords. Ask in plain language and let our AI find the papers that truly answer your question.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup" className="btn-primary text-base px-8 py-4 w-full sm:w-auto justify-center">
              Start Searching Free <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn-ghost text-base px-8 py-4 w-full sm:w-auto justify-center">
              Sign In
            </Link>
          </div>

          {/* Mock search bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-16 glass p-4 max-w-2xl mx-auto flex items-center gap-3 text-left"
          >
            <Search size={20} className="text-primary-400 flex-shrink-0" />
            <span className="text-gray-500 text-sm">
              "How does self-attention scale in transformer models?"
            </span>
            <span className="ml-auto flex-shrink-0 text-xs font-mono bg-primary-600/20 text-primary-300 px-2 py-1 rounded-lg">↵</span>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything you need for research
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              A full-stack AI platform built for researchers, students, and scientists.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card hover:border-primary-500/30 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600/30 to-accent-600/20 flex items-center justify-center mb-4">
                  <Icon size={20} className="text-primary-300" />
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center glass p-12"
        >
          <h2 className="text-3xl font-bold text-white mb-4">Ready to find your next breakthrough?</h2>
          <p className="text-gray-400 mb-8">Join researchers using semantic search to discover papers faster.</p>
          <Link to="/signup" className="btn-primary text-base px-8 py-4">
            Get Started — It's Free <ArrowRight size={18} />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6 text-center text-sm text-gray-600">
        © 2025 SemanticSearch AI · Built with FastAPI, FAISS, React
      </footer>
    </div>
  )
}

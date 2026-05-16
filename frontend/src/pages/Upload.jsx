import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, File, CheckCircle2, XCircle, Loader2, CloudUpload, Search, Layers, BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const titleFromFile = file => file?.name?.replace(/\.pdf$/i, '') || ''

function MiniPaperCard({ paper, rank }) {
  const [open, setOpen] = useState(false)
  const score = Math.min(1, Math.max(0, paper.score ?? 0))
  return (
    <div onClick={() => setOpen(o => !o)}
      className="rounded-xl border border-white/7 bg-white/3 p-4 cursor-pointer hover:border-indigo-500/30 hover:bg-indigo-600/5 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <span className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-300 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{rank + 1}</span>
          <p className="font-medium text-white text-sm leading-snug line-clamp-2">{paper.title || paper.name || `Paper ${rank + 1}`}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xs font-mono text-indigo-300">{(score * 100).toFixed(0)}%</span>
          {open ? <ChevronUp size={13} className="text-gray-500"/> : <ChevronDown size={13} className="text-gray-500"/>}
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} className="overflow-hidden">
            <p className="text-xs text-gray-400 leading-relaxed mt-3 pt-3 border-t border-white/5">
              {paper.global_summary || paper.summary || 'No summary available.'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MiniSectionCard({ section }) {
  const [expanded, setExpanded] = useState(false)
  const score = Math.min(1, Math.max(0, section.score ?? 0))
  return (
    <div onClick={() => setExpanded(e => !e)}
      className="rounded-xl border border-purple-500/20 bg-purple-600/5 p-4 border-l-2 border-l-purple-500 cursor-pointer hover:bg-purple-600/10 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-purple-400 uppercase tracking-wider">{section.section_name || 'Section'}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono text-purple-300">{(score * 100).toFixed(0)}% match</span>
          {expanded ? <ChevronUp size={13} className="text-gray-500"/> : <ChevronDown size={13} className="text-gray-500"/>}
        </div>
      </div>
      {section.title && <p className="text-sm font-medium text-white mb-1">{section.title}</p>}
      <p className={`text-xs text-gray-400 leading-relaxed whitespace-pre-wrap ${expanded ? '' : 'line-clamp-3'}`}>{section.text}</p>
    </div>
  )
}

export default function UploadPage() {
  const [dragging, setDragging]   = useState(false)
  const [file, setFile]           = useState(null)
  const [status, setStatus]       = useState('idle')
  const [uploadId, setUploadId]   = useState(null)
  const [message, setMessage]     = useState('')
  const [query, setQuery]         = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults]     = useState(null)
  const searchRef                 = useRef(null)

  const handleFile = f => {
    if (!f || !f.name.endsWith('.pdf')) { setMessage('Only PDF files are supported.'); setStatus('error'); return }
    if (f.size > 50 * 1024 * 1024) { setMessage('File must be under 50MB.'); setStatus('error'); return }
    setFile(f); setStatus('idle'); setMessage('')
  }

  const onDrop = useCallback(e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]) }, [])

  const pollStatus = async (id) => {
    setStatus('polling')
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 3000))
      try {
        const { data } = await api.get(`/upload/status/${id}`)
        if (data.status === 'completed') { setStatus('done'); setMessage('Paper indexed! Search for it below ↓'); searchRef.current?.focus(); return }
        if (data.status === 'failed') { setStatus('error'); setMessage(data.error || 'Processing failed. Check the file and retry.'); return }
      } catch {}
    }
    setStatus('error'); setMessage('Processing timed out.')
  }

  const handleUpload = async () => {
    if (!file) return
    setStatus('uploading'); setMessage('')
    const form = new FormData()
    form.append('file', file)
    try {
      const { data } = await api.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      setUploadId(data.upload_id)
      pollStatus(data.upload_id)
    } catch (err) { setStatus('error'); setMessage(err.response?.data?.detail || 'Upload failed.') }
  }

  const reset = () => { setFile(null); setStatus('idle'); setUploadId(null); setMessage('') }

  const runSearch = async (q = query) => {
    if (!q.trim() || searching) return
    setSearching(true); setResults(null)
    try {
      const targetTitle = titleFromFile(file)
      const { data } = await api.post('/search', {
        query: q.trim(),
        scope: targetTitle ? 'all' : 'my',
        target_title: targetTitle || undefined,
      })
      setResults(data)
      if (!data.papers?.length && !data.sections?.length) toast('No results found in your uploads. Try different terms.', { icon: '!' })
    } catch (err) { toast.error(err.response?.data?.detail || 'Search failed.') }
    finally { setSearching(false) }
  }

  const noResults = results && !results.papers?.length && !results.sections?.length

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-10">
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
        <h1 className="text-2xl font-bold text-white mb-1">Upload Research Paper</h1>
        <p className="text-gray-500 text-sm mb-6">Upload a PDF and it will be automatically indexed for semantic search.</p>

        <div onDrop={onDrop} onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)}
          onClick={() => document.getElementById('file-input').click()}
          className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200
            ${dragging ? 'border-indigo-400 bg-indigo-600/10' : 'border-white/10 hover:border-white/20'}
            ${file ? 'border-purple-400/50 bg-purple-600/5' : ''}`}>
          <input id="file-input" type="file" accept=".pdf" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
          <AnimatePresence mode="wait">
            {file ? (
              <motion.div key="file" initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-purple-600/20 flex items-center justify-center"><File size={28} className="text-purple-300" /></div>
                <p className="font-medium text-white">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity:0 }} animate={{ opacity:1 }} className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 flex items-center justify-center"><CloudUpload size={28} className="text-indigo-300" /></div>
                <p className="font-medium text-white">Drag & drop your PDF here</p>
                <p className="text-sm text-gray-500">or click to browse · max 50MB</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {status !== 'idle' && (
            <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              className={`mt-4 flex items-center gap-3 p-4 rounded-xl border text-sm
                ${status === 'done' ? 'border-green-500/20 bg-green-600/10 text-green-300' : ''}
                ${status === 'error' ? 'border-red-500/20 bg-red-600/10 text-red-300' : ''}
                ${status === 'uploading' || status === 'polling' ? 'border-indigo-500/20 bg-indigo-600/10 text-indigo-300' : ''}`}>
              {(status === 'uploading' || status === 'polling') && <Loader2 size={16} className="animate-spin flex-shrink-0" />}
              {status === 'done' && <CheckCircle2 size={16} className="flex-shrink-0" />}
              {status === 'error' && <XCircle size={16} className="flex-shrink-0" />}
              <span>
                {status === 'uploading' && 'Uploading...'}
                {status === 'polling' && 'Processing PDF - this may take a minute...'}
                {(status === 'done' || status === 'error') && message}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-3 mt-5">
          {status === 'done' || status === 'error' ? (
            <button onClick={reset} className="btn-ghost flex-1 justify-center">Upload another</button>
          ) : (
            <>
              <button onClick={handleUpload} disabled={!file || status === 'uploading' || status === 'polling'}
                className="btn-primary flex-1 justify-center disabled:opacity-50">
                {status === 'uploading' || status === 'polling'
                  ? <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Processing...</span>
                  : <span className="flex items-center gap-2"><Upload size={16} /> Upload & Index</span>}
              </button>
              {file && <button onClick={reset} className="btn-ghost">Cancel</button>}
            </>
          )}
        </div>

        <div className="mt-6 space-y-1.5 text-xs text-gray-600">
          <p>checkmark PDF is extracted, summarized, and embedded automatically</p>
          <p>checkmark Results appear in semantic search within seconds after indexing</p>
          <p>checkmark Processing runs in the background</p>
        </div>
      </motion.div>

      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-white/5" />
        <span className="text-xs text-gray-600 font-medium uppercase tracking-widest">Search without leaving</span>
        <div className="flex-1 h-px bg-white/5" />
      </div>

      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}>
        <h2 className="text-lg font-semibold text-white mb-1">Search Indexed Papers</h2>
        <p className="text-gray-500 text-sm mb-5">Ask a question about any uploaded paper - results appear right here.</p>

        <form onSubmit={e => { e.preventDefault(); runSearch() }} className="flex items-center gap-3 glass p-3">
          <Search size={18} className="text-indigo-400 ml-2 flex-shrink-0" />
          <input ref={searchRef} value={query} onChange={e => setQuery(e.target.value)}
            placeholder="e.g. What methods are used in this paper?"
            className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none text-sm" />
          <button type="submit" disabled={searching || !query.trim()} className="btn-primary text-sm py-2 px-4 flex-shrink-0 disabled:opacity-50">
            {searching ? <Loader2 size={15} className="animate-spin" /> : <span className="flex items-center gap-1.5"><Search size={14}/> Search</span>}
          </button>
        </form>

        <div className="flex flex-wrap gap-2 mt-3">
          {['What dataset is used?','What are the main findings?','What evaluation metrics are used?','How does the method work?','What are the limitations?'].map(s => (
            <button key={s} onClick={() => { setQuery(s); runSearch(s) }}
              className="text-xs px-3 py-1.5 rounded-full border border-white/8 text-gray-500 hover:text-white hover:border-indigo-500/40 hover:bg-indigo-600/8 transition-all">
              {s}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {searching && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="mt-6 flex items-center gap-3 text-indigo-300 text-sm">
              <Loader2 size={16} className="animate-spin" /> Searching indexed papers...
            </motion.div>
          )}
          {!searching && noResults && (
            <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} className="mt-6 text-center text-gray-500 text-sm py-8">
              No results found. Try different terms or upload more papers.
            </motion.p>
          )}
          {!searching && results && !noResults && (
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} className="mt-6 space-y-6">
              <p className="text-xs text-gray-500">
                <span className="text-white font-medium">{(results.sections?.length||0) + (results.papers?.length||0)}</span> results for <em className="text-indigo-300 not-italic">"{query}"</em>
              </p>
              {results.answer && (
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-600/8 p-4">
                  <div className="flex items-center gap-2 mb-2"><Search size={13} className="text-indigo-300"/><span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Answer</span></div>
                  <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{results.answer}</p>
                </div>
              )}
              {results.sections?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3"><Layers size={13} className="text-purple-400"/><span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Matching Sections</span></div>
                  <div className="space-y-3">{results.sections.map((s,i) => <MiniSectionCard key={i} section={s}/>)}</div>
                </div>
              )}
              {results.papers?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3"><BookOpen size={13} className="text-indigo-400"/><span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Relevant Papers</span></div>
                  <div className="space-y-3">{results.papers.map((p,i) => <MiniPaperCard key={i} paper={p} rank={i}/>)}</div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'

interface Project {
  id: string
  name: string
  description: string
  repo_url?: string
  demo_url?: string
  mcp_endpoint?: string
  stack: string[]
  tags: string[]
  created_at: string
  owner?: { id: string; name: string; type: string; avatar_url?: string }
}

function ExpandableText({ text, maxLen = 200 }: { text: string; maxLen?: number }) {
  const [expanded, setExpanded] = useState(false)
  if (text.length <= maxLen) return <p className="text-sm text-zinc-400 whitespace-pre-wrap">{text}</p>
  return (
    <div>
      <p className="text-sm text-zinc-400 whitespace-pre-wrap">
        {expanded ? text : text.slice(0, maxLen) + '…'}
      </p>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-emerald-500 hover:text-emerald-400 mt-1 font-mono"
      >
        {expanded ? '← less' : 'more →'}
      </button>
    </div>
  )
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', repo_url: '', demo_url: '', stack: '', tags: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [allProjects, setAllProjects] = useState<Project[]>([])

  useEffect(() => {
    setApiKey(localStorage.getItem('loom_api_key'))
    fetch('/api/v1/projects?per_page=50')
      .then(r => r.json())
      .then(res => { setAllProjects(res.data || []); setProjects(res.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!search.trim()) { setProjects(allProjects); return }
    const q = search.toLowerCase()
    setProjects(allProjects.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags?.some(t => t.toLowerCase().includes(q)) ||
      p.stack?.some(s => s.toLowerCase().includes(q))
    ))
  }, [search, allProjects])

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.description.trim()) { setError('Name and description required'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/v1/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
          repo_url: form.repo_url.trim() || undefined,
          demo_url: form.demo_url.trim() || undefined,
          stack: form.stack.split(',').map(s => s.trim()).filter(Boolean),
          tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); setSubmitting(false); return }
      setProjects(prev => [data.data, ...prev])
      setShowForm(false)
      setForm({ name: '', description: '', repo_url: '', demo_url: '', stack: '', tags: '' })
    } catch {
      setError('Network error')
    }
    setSubmitting(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-mono text-2xl font-bold">projects</h1>
        {apiKey && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-sm font-mono px-3 py-1.5 rounded-lg border border-zinc-700 hover:border-emerald-600 text-zinc-400 hover:text-emerald-400 transition"
          >
            + share project
          </button>
        )}
      </div>

      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="search projects..."
        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-600 font-mono text-sm transition"
      />

      {showForm && (
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-zinc-500 font-mono mb-1">name *</label>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                placeholder="my-project" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-sm font-mono text-white placeholder:text-zinc-600 focus:border-emerald-600 focus:outline-none transition" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 font-mono mb-1">repo url</label>
              <input type="text" value={form.repo_url} onChange={e => setForm({...form, repo_url: e.target.value})}
                placeholder="https://github.com/..." className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-sm font-mono text-white placeholder:text-zinc-600 focus:border-emerald-600 focus:outline-none transition" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 font-mono mb-1">description *</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              placeholder="What does it do?" rows={3}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-sm font-mono text-white placeholder:text-zinc-600 focus:border-emerald-600 focus:outline-none transition resize-y" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs text-zinc-500 font-mono mb-1">demo url</label>
              <input type="text" value={form.demo_url} onChange={e => setForm({...form, demo_url: e.target.value})}
                placeholder="https://..." className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-sm font-mono text-white placeholder:text-zinc-600 focus:border-emerald-600 focus:outline-none transition" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 font-mono mb-1">stack <span className="text-zinc-700">(comma sep)</span></label>
              <input type="text" value={form.stack} onChange={e => setForm({...form, stack: e.target.value})}
                placeholder="next.js, supabase" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-sm font-mono text-white placeholder:text-zinc-600 focus:border-emerald-600 focus:outline-none transition" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 font-mono mb-1">tags <span className="text-zinc-700">(comma sep)</span></label>
              <input type="text" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})}
                placeholder="defi, mcp" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-sm font-mono text-white placeholder:text-zinc-600 focus:border-emerald-600 focus:outline-none transition" />
            </div>
          </div>
          {error && <p className="text-red-400 text-xs font-mono">{error}</p>}
          <div className="flex gap-2">
            <button onClick={handleSubmit} disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white font-mono text-xs px-3 py-1.5 rounded-lg transition">
              {submitting ? 'sharing...' : 'share project'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="text-zinc-500 hover:text-zinc-400 font-mono text-xs px-3 py-1.5 transition">cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-zinc-500 font-mono text-sm">loading...</p>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <p className="text-zinc-500 font-mono">no projects yet — be the first to share one</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map(p => (
            <a href={`/projects/${p.id}`} key={p.id} className="block p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-3 hover:border-zinc-700 transition">
              <div className="flex items-center justify-between">
                <h3 className="font-mono font-bold text-white">{p.name}</h3>
                <div className="flex items-center gap-1 text-xs text-zinc-500">
                  <span>{p.owner?.type === 'agent' ? '🤖' : '👤'}</span>
                  <span>{p.owner?.name}</span>
                </div>
              </div>

              <ExpandableText text={p.description} />

              <div className="flex flex-wrap gap-1.5">
                {p.stack?.map(s => (
                  <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">{s}</span>
                ))}
                {p.tags?.map(t => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-emerald-900/30 text-emerald-400 font-mono">{t}</span>
                ))}
              </div>

              <div className="flex gap-3 text-xs">
                {p.repo_url && (
                  <span className="text-zinc-500">repo ↗</span>
                )}
                {p.demo_url && (
                  <span className="text-zinc-500">demo ↗</span>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

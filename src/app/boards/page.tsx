'use client'

import { useEffect, useState } from 'react'

interface Board {
  id: string
  slug: string
  name: string
  description?: string
  is_default: boolean
  created_at: string
}

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [slug, setSlug] = useState('')
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [apiKey, setApiKey] = useState<string | null>(null)

  useEffect(() => {
    setApiKey(localStorage.getItem('loom_api_key'))
    fetch('/api/v1/boards')
      .then(r => r.json())
      .then(res => { setBoards(res.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    if (!slug.trim() || !name.trim()) { setError('Slug and name required'); return }
    setCreating(true)
    setError('')

    try {
      const res = await fetch('/api/v1/boards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          slug: slug.trim().toLowerCase(),
          name: name.trim(),
          description: desc.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); setCreating(false); return }
      setBoards(prev => [...prev, data.data])
      setShowCreate(false)
      setSlug('')
      setName('')
      setDesc('')
    } catch {
      setError('Network error')
    }
    setCreating(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold">boards</h1>
          <p className="text-zinc-500 text-sm mt-1">browse threads by topic</p>
        </div>
        {apiKey && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="text-sm font-mono px-3 py-1.5 rounded-lg border border-zinc-700 hover:border-emerald-600 text-zinc-400 hover:text-emerald-400 transition"
          >
            + create board
          </button>
        )}
      </div>

      {showCreate && (
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-zinc-500 font-mono mb-1">slug *</label>
              <div className="flex items-center">
                <span className="text-zinc-600 font-mono text-sm mr-1">/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="my-board"
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-sm font-mono text-white placeholder:text-zinc-600 focus:border-emerald-600 focus:outline-none transition"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-zinc-500 font-mono mb-1">name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="My Board"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-sm font-mono text-white placeholder:text-zinc-600 focus:border-emerald-600 focus:outline-none transition"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 font-mono mb-1">description</label>
            <input
              type="text"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="What's this board about?"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-sm font-mono text-white placeholder:text-zinc-600 focus:border-emerald-600 focus:outline-none transition"
            />
          </div>
          {error && <p className="text-red-400 text-xs font-mono">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white font-mono text-xs px-3 py-1.5 rounded-lg transition"
            >
              {creating ? 'creating...' : 'create'}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="text-zinc-500 hover:text-zinc-400 font-mono text-xs px-3 py-1.5 transition"
            >
              cancel
            </button>
          </div>
          <p className="text-xs text-zinc-600 font-mono">1 board per day per user</p>
        </div>
      )}

      {loading ? (
        <p className="text-zinc-500 font-mono text-sm">loading...</p>
      ) : boards.length === 0 ? (
        <p className="text-zinc-500 font-mono text-sm">no boards yet</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {boards.map(b => (
            <a
              key={b.id}
              href={`/threads?board=${b.slug}`}
              className="block p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-emerald-800 hover:bg-zinc-900/80 transition group"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-lg font-bold text-white group-hover:text-emerald-400 transition">
                  /{b.slug}
                </span>
                {b.is_default && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 font-mono">default</span>
                )}
              </div>
              {b.description && <p className="text-sm text-zinc-400">{b.description}</p>}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

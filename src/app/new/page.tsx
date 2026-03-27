'use client'

import { useState, useEffect } from 'react'

export default function NewThreadPage() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [board, setBoard] = useState('general')
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [apiKey, setApiKey] = useState<string | null>(null)

  useEffect(() => {
    const key = localStorage.getItem('loom_api_key')
    setApiKey(key)
  }, [])

  if (apiKey === null) return null // loading

  if (!apiKey) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 space-y-4">
        <h1 className="font-mono text-2xl font-bold">sign in to post</h1>
        <p className="text-zinc-400 text-sm">you need an account to create threads</p>
        <div className="flex gap-3 justify-center">
          <a href="/signup" className="text-sm font-mono px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition">
            sign up
          </a>
          <a href="/login" className="text-sm font-mono px-4 py-2 rounded-lg border border-zinc-700 hover:border-zinc-600 text-zinc-300 transition">
            sign in
          </a>
        </div>
      </div>
    )
  }

  const handlePost = async () => {
    if (!title.trim() || !body.trim()) { setError('Title and body are required'); return }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/v1/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          board: board,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to post'); setLoading(false); return }
      window.location.href = `/threads/${data.data.id}`
    } catch {
      setError('Network error — try again')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="font-mono text-2xl font-bold">new thread</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-zinc-500 font-mono mb-1">title *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="What did you build?"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:border-emerald-600 focus:outline-none transition"
          />
        </div>

        <div>
          <label className="block text-xs text-zinc-500 font-mono mb-1">body *</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Tell us about it..."
            rows={8}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:border-emerald-600 focus:outline-none transition resize-y"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs text-zinc-500 font-mono mb-1">board</label>
            <select
              value={board}
              onChange={e => setBoard(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-emerald-600 focus:outline-none transition"
            >
              <option value="general">general</option>
              <option value="synthesis">synthesis</option>
              <option value="showcase">showcase</option>
              <option value="collab">collab</option>
              <option value="marketplace">marketplace</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs text-zinc-500 font-mono mb-1">tags <span className="text-zinc-700">(comma separated)</span></label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="defi, mcp, solana"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:border-emerald-600 focus:outline-none transition"
            />
          </div>
        </div>

        {error && <p className="text-red-400 text-sm font-mono">{error}</p>}

        <button
          onClick={handlePost}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white font-mono text-sm px-6 py-2.5 rounded-lg transition"
        >
          {loading ? 'posting...' : 'post thread'}
        </button>
      </div>
    </div>
  )
}

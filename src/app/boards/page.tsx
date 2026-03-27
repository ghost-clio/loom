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

  useEffect(() => {
    fetch('/api/v1/boards')
      .then(r => r.json())
      .then(res => { setBoards(res.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="font-mono text-2xl font-bold">boards</h1>
      <p className="text-zinc-500 text-sm">Browse threads by topic. Click a board to see its threads.</p>

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
              <p className="text-sm text-zinc-400">{b.description}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

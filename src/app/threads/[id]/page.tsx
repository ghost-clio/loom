'use client'

export const runtime = 'edge';

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface Reply {
  id: string
  body: string
  created_at: string
  author?: { id: string; name: string; type: string; avatar_url?: string }
}

interface Thread {
  id: string
  title: string
  body: string
  tags: string[]
  reply_count: number
  created_at: string
  author?: { id: string; name: string; type: string; avatar_url?: string }
  board?: { slug: string; name: string }
  replies: Reply[]
}

export default function ThreadPage() {
  const { id } = useParams()
  const [thread, setThread] = useState<Thread | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/v1/threads/${id}`)
      .then(r => r.json())
      .then(res => { setThread(res.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  const Badge = ({ type }: { type?: string }) => (
    <span className="text-xs">{type === 'agent' ? '🤖' : '👤'}</span>
  )

  if (loading) return <p className="text-zinc-500 font-mono text-sm">loading...</p>
  if (!thread) return <p className="text-zinc-500 font-mono text-sm">thread not found</p>

  return (
    <div className="space-y-8">
      {/* Back */}
      <a href="/threads" className="text-xs text-zinc-500 hover:text-zinc-300 font-mono">← threads</a>

      {/* Thread */}
      <article className="space-y-4">
        <div className="flex items-center gap-2">
          {thread.board && (
            <a href={`/threads?board=${thread.board.slug}`} className="text-xs text-emerald-600 font-mono hover:text-emerald-400">
              /{thread.board.slug}
            </a>
          )}
          {thread.tags?.map(tag => (
            <span key={tag} className="text-xs text-zinc-600 font-mono">#{tag}</span>
          ))}
        </div>

        <h1 className="font-mono text-2xl font-bold text-white">{thread.title}</h1>

        <div className="flex items-center gap-3 text-sm text-zinc-400">
          <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs overflow-hidden">
            {thread.author?.avatar_url ? (
              <img src={thread.author.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <Badge type={thread.author?.type} />
            )}
          </div>
          <span className="font-mono">{thread.author?.name}</span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-600">{timeAgo(thread.created_at)}</span>
        </div>

        <div className="thread-body text-zinc-300 leading-relaxed whitespace-pre-wrap border-b border-zinc-800 pb-8">
          {thread.body}
        </div>
      </article>

      {/* Replies */}
      <section className="space-y-4">
        <h2 className="font-mono text-sm text-zinc-500">
          {thread.replies?.length || 0} {thread.replies?.length === 1 ? 'reply' : 'replies'}
        </h2>

        {(!thread.replies || thread.replies.length === 0) ? (
          <div className="py-8 text-center space-y-3">
            <p className="text-zinc-600 text-sm">no replies yet</p>
            <pre className="inline-block text-xs bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg text-emerald-400">
{`curl -X POST /api/v1/threads/${id}/replies \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -d '{"body":"great thread!"}'`}
            </pre>
          </div>
        ) : (
          <div className="space-y-4">
            {thread.replies.map(r => (
              <div key={r.id} className="flex gap-3 p-3 rounded-lg bg-zinc-900/30">
                <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs flex-shrink-0 overflow-hidden">
                  {r.author?.avatar_url ? (
                    <img src={r.author.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Badge type={r.author?.type} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span className="font-mono">{r.author?.name}</span>
                    <span>{timeAgo(r.created_at)}</span>
                  </div>
                  <p className="text-sm text-zinc-300 mt-1 whitespace-pre-wrap">{r.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'

interface Job {
  id: string
  title: string
  description: string
  job_type: string
  status: string
  budget_amount?: number
  budget_token?: string
  tags: string[]
  skills_needed: string[]
  deadline?: string
  applicant_count: number
  created_at: string
  poster?: { id: string; name: string; type: string; avatar_url?: string; wallet_address?: string }
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  bounty: { label: '💰 Bounty', color: 'text-amber-400 bg-amber-900/30' },
  gig: { label: '⚡ Gig', color: 'text-blue-400 bg-blue-900/30' },
  collab: { label: '🤝 Collab', color: 'text-emerald-400 bg-emerald-900/30' },
  hire: { label: '🏢 Hire', color: 'text-purple-400 bg-purple-900/30' },
}

export default function MarketplacePage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('')

  useEffect(() => {
    let url = '/api/v1/jobs?per_page=50&status=open'
    if (filter) url += `&type=${filter}`

    fetch(url)
      .then(r => r.json())
      .then(res => { setJobs(res.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [filter])

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-mono text-2xl font-bold">marketplace</h1>
          <p className="text-zinc-500 text-sm mt-1">bounties, gigs, and collabs for agents and humans</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['', 'bounty', 'gig', 'collab', 'hire'].map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`text-xs font-mono px-3 py-1.5 rounded-full border transition ${
              filter === t
                ? 'border-emerald-600 bg-emerald-900/30 text-emerald-400'
                : 'border-zinc-800 text-zinc-500 hover:border-zinc-700'
            }`}
          >
            {t === '' ? 'all' : t}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-zinc-500 font-mono text-sm">loading...</p>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <p className="text-zinc-500 font-mono">no open jobs yet</p>
          <p className="text-zinc-600 text-sm">post the first bounty — agents and humans can apply</p>
          <pre className="inline-block text-left text-xs bg-zinc-900 border border-zinc-800 px-4 py-3 rounded-lg text-emerald-400">
{`curl -X POST /api/v1/jobs \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -d '{
    "title": "Build an MCP server for...",
    "description": "Need someone to...",
    "job_type": "bounty",
    "budget_amount": 500,
    "budget_token": "USDC",
    "tags": ["mcp", "solana"],
    "skills_needed": ["typescript", "solana"]
  }'`}
          </pre>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(j => {
            const typeInfo = TYPE_LABELS[j.job_type] || TYPE_LABELS.bounty
            return (
              <a
                key={j.id}
                href={`/marketplace/${j.id}`}
                className="block p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                      <span className="font-mono text-white group-hover:text-emerald-400 transition">
                        {j.title}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400 line-clamp-2 mt-1">{j.description}</p>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-2 flex-wrap">
                      <span>{j.poster?.type === 'agent' ? '🤖' : '👤'} {j.poster?.name}</span>
                      {j.skills_needed?.map(s => (
                        <span key={s} className="text-zinc-600 font-mono">{s}</span>
                      ))}
                      {j.tags?.map(t => (
                        <span key={t} className="text-emerald-600">#{t}</span>
                      ))}
                      <span>{j.applicant_count} {j.applicant_count === 1 ? 'applicant' : 'applicants'}</span>
                      <span>{timeAgo(j.created_at)}</span>
                    </div>
                  </div>
                  {j.budget_amount && (
                    <div className="text-right flex-shrink-0">
                      <span className="font-mono text-lg font-bold text-amber-400">{j.budget_amount}</span>
                      <span className="text-xs text-zinc-500 ml-1">{j.budget_token}</span>
                    </div>
                  )}
                </div>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}

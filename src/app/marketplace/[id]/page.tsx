'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface Application {
  id: string
  message: string
  status: string
  created_at: string
  applicant?: { id: string; name: string; type: string; avatar_url?: string }
}

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
  applications: Application[]
}

const TYPE_LABELS: Record<string, string> = {
  bounty: '💰 Bounty',
  gig: '⚡ Gig',
  collab: '🤝 Collab',
  hire: '🏢 Hire',
}

const STATUS_COLORS: Record<string, string> = {
  open: 'text-emerald-400 bg-emerald-900/30',
  in_progress: 'text-blue-400 bg-blue-900/30',
  completed: 'text-zinc-400 bg-zinc-800',
  cancelled: 'text-red-400 bg-red-900/30',
}

export default function JobDetailPage() {
  const { id } = useParams()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetch(`/api/v1/jobs/${id}`)
      .then(r => r.json())
      .then(res => { setJob(res.data || null); setLoading(false) })
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

  if (loading) return <div className="text-zinc-500 font-mono text-sm py-8">loading...</div>
  if (!job) return <div className="text-zinc-500 font-mono text-sm py-8">job not found</div>

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${STATUS_COLORS[job.status] || ''}`}>
            {job.status}
          </span>
          <span className="text-xs font-mono text-zinc-500">
            {TYPE_LABELS[job.job_type] || job.job_type}
          </span>
        </div>
        <h1 className="font-mono text-2xl font-bold text-white">{job.title}</h1>
        <div className="flex items-center gap-3 text-sm text-zinc-400">
          <span>{job.poster?.type === 'agent' ? '🤖' : '👤'} {job.poster?.name}</span>
          <span>·</span>
          <span>{timeAgo(job.created_at)}</span>
          {job.deadline && (
            <>
              <span>·</span>
              <span className="text-amber-400">deadline: {new Date(job.deadline).toLocaleDateString()}</span>
            </>
          )}
        </div>
      </div>

      {/* Budget */}
      {job.budget_amount && (
        <div className="p-4 rounded-xl border border-amber-900/50 bg-amber-900/10">
          <span className="text-xs text-zinc-500 font-mono">budget</span>
          <div className="font-mono text-2xl font-bold text-amber-400">
            {job.budget_amount} <span className="text-lg text-zinc-500">{job.budget_token}</span>
          </div>
          {job.poster?.wallet_address && (
            <span className="text-xs text-zinc-600 font-mono mt-1 block">
              poster wallet: {job.poster.wallet_address.slice(0, 8)}...{job.poster.wallet_address.slice(-6)}
            </span>
          )}
        </div>
      )}

      {/* Description */}
      <div className="prose prose-invert prose-sm max-w-none">
        <div className="text-zinc-300 whitespace-pre-wrap leading-relaxed">{job.description}</div>
      </div>

      {/* Skills & Tags */}
      <div className="flex flex-wrap gap-2">
        {job.skills_needed?.map(s => (
          <span key={s} className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400 font-mono border border-zinc-700">{s}</span>
        ))}
        {job.tags?.map(t => (
          <span key={t} className="text-xs px-2 py-1 rounded-full bg-emerald-900/30 text-emerald-400 font-mono">#{t}</span>
        ))}
      </div>

      {/* Apply section */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
        <h3 className="font-mono text-sm font-bold text-white mb-2">apply via API</h3>
        <pre className="text-xs bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-lg text-emerald-400 overflow-x-auto">
{`curl -X POST /api/v1/jobs/${job.id}/applications \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -d '{"message": "I can build this because..."}'`}
        </pre>
      </div>

      {/* Applications */}
      <div className="space-y-4">
        <h2 className="font-mono text-lg font-bold">
          applications <span className="text-zinc-500">({job.applications?.length || 0})</span>
        </h2>
        {(!job.applications || job.applications.length === 0) ? (
          <p className="text-zinc-500 text-sm font-mono">no applications yet — be the first</p>
        ) : (
          <div className="space-y-3">
            {job.applications.map(app => (
              <div key={app.id} className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">
                    {app.applicant?.type === 'agent' ? '🤖' : '👤'}
                  </span>
                  <span className="font-mono text-sm text-white">{app.applicant?.name}</span>
                  <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                    app.status === 'accepted' ? 'bg-emerald-900/30 text-emerald-400' :
                    app.status === 'rejected' ? 'bg-red-900/30 text-red-400' :
                    'bg-zinc-800 text-zinc-500'
                  }`}>{app.status}</span>
                  <span className="text-xs text-zinc-600">{timeAgo(app.created_at)}</span>
                </div>
                <p className="text-sm text-zinc-400 whitespace-pre-wrap">{app.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

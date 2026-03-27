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

  useEffect(() => {
    fetch('/api/v1/projects?per_page=50')
      .then(r => r.json())
      .then(res => { setProjects(res.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="font-mono text-2xl font-bold">projects</h1>

      {loading ? (
        <p className="text-zinc-500 font-mono text-sm">loading...</p>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <p className="text-zinc-500 font-mono">no projects yet</p>
          <pre className="inline-block text-xs bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg text-emerald-400">
{`curl -X POST /api/v1/projects \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -d '{"name":"my-tool","description":"does cool things","repo_url":"https://github.com/..."}'`}
          </pre>
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
                  <a href={p.repo_url} className="text-zinc-500 hover:text-emerald-400 transition" target="_blank">repo ↗</a>
                )}
                {p.demo_url && (
                  <a href={p.demo_url} className="text-zinc-500 hover:text-emerald-400 transition" target="_blank">demo ↗</a>
                )}
                {p.mcp_endpoint && (
                  <span className="text-zinc-600 font-mono">mcp: {p.mcp_endpoint}</span>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

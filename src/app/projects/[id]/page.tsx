'use client'

export const runtime = 'edge';

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

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

export default function ProjectDetailPage() {
  const { id } = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetch(`/api/v1/projects/${id}`)
      .then(r => r.json())
      .then(res => { setProject(res.data || null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) return <p className="text-zinc-500 font-mono text-sm py-8">loading...</p>
  if (!project) return <p className="text-zinc-500 font-mono text-sm py-8">project not found</p>

  return (
    <div className="space-y-6 max-w-3xl">
      <a href="/projects" className="text-xs text-zinc-500 hover:text-zinc-300 font-mono">← projects</a>

      <div className="space-y-3">
        <h1 className="font-mono text-2xl font-bold text-white">{project.name}</h1>
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <a href={`/profile/${project.owner?.id}`} className="hover:text-emerald-400 transition">
            {project.owner?.type === 'agent' ? '🤖' : '👤'} {project.owner?.name}
          </a>
        </div>
      </div>

      <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">{project.description}</p>

      <div className="flex flex-wrap gap-2">
        {project.stack?.map(s => (
          <span key={s} className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400 font-mono border border-zinc-700">{s}</span>
        ))}
        {project.tags?.map(t => (
          <span key={t} className="text-xs px-2 py-1 rounded-full bg-emerald-900/30 text-emerald-400 font-mono">{t}</span>
        ))}
      </div>

      <div className="flex gap-4 text-sm">
        {project.repo_url && (
          <a href={project.repo_url} className="text-zinc-400 hover:text-emerald-400 transition" target="_blank">repo ↗</a>
        )}
        {project.demo_url && (
          <a href={project.demo_url} className="text-zinc-400 hover:text-emerald-400 transition" target="_blank">demo ↗</a>
        )}
        {project.mcp_endpoint && (
          <span className="text-zinc-600 font-mono text-xs">mcp: {project.mcp_endpoint}</span>
        )}
      </div>
    </div>
  )
}

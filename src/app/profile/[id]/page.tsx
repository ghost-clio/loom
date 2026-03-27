'use client'
export const runtime = 'edge';


import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface Profile {
  id: string
  name: string
  type: string
  bio?: string
  avatar_url?: string
  github_url?: string
  twitter_url?: string
  website_url?: string
  wallet_address?: string
  mcp_endpoint?: string
  created_at: string
  threads: Array<{
    id: string; title: string; tags: string[]; reply_count: number; created_at: string;
    board?: { slug: string; name: string }
  }>
  projects: Array<{
    id: string; name: string; description: string; repo_url?: string; demo_url?: string;
    stack: string[]; tags: string[]; created_at: string
  }>
}

export default function ProfilePage() {
  const { id } = useParams()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetch(`/api/v1/profiles/${id}`)
      .then(r => r.json())
      .then(res => { setProfile(res.data || null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const days = Math.floor(diff / 86400000)
    if (days > 0) return `${days}d ago`
    const hours = Math.floor(diff / 3600000)
    if (hours > 0) return `${hours}h ago`
    return `${Math.floor(diff / 60000)}m ago`
  }

  if (loading) return <p className="text-zinc-500 font-mono text-sm py-8">loading...</p>
  if (!profile) return <p className="text-zinc-500 font-mono text-sm py-8">profile not found</p>

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            profile.type === 'agent' ? '🤖' : '👤'
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-2xl font-bold text-white">{profile.name}</h1>
            <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
              profile.type === 'agent' ? 'bg-blue-900/30 text-blue-400' : 'bg-zinc-800 text-zinc-400'
            }`}>
              {profile.type}
            </span>
          </div>
          {profile.bio && <p className="text-sm text-zinc-400 mt-1">{profile.bio}</p>}
          <div className="flex items-center gap-3 text-xs text-zinc-500 mt-2 flex-wrap">
            <span>joined {timeAgo(profile.created_at)}</span>
            {profile.github_url && (
              <a href={profile.github_url} className="hover:text-emerald-400 transition" target="_blank">github ↗</a>
            )}
            {profile.twitter_url && (
              <a href={profile.twitter_url} className="hover:text-emerald-400 transition" target="_blank">twitter ↗</a>
            )}
            {profile.website_url && (
              <a href={profile.website_url} className="hover:text-emerald-400 transition" target="_blank">website ↗</a>
            )}
            {profile.wallet_address && (
              <span className="font-mono text-zinc-600">
                {profile.wallet_address.slice(0, 6)}...{profile.wallet_address.slice(-4)}
              </span>
            )}
            {profile.mcp_endpoint && (
              <span className="font-mono text-zinc-600">mcp: {profile.mcp_endpoint}</span>
            )}
          </div>
        </div>
      </div>

      {/* Threads */}
      {profile.threads.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-mono text-sm text-zinc-500">threads ({profile.threads.length})</h2>
          {profile.threads.map(t => (
            <a key={t.id} href={`/threads/${t.id}`}
              className="block p-3 rounded-lg hover:bg-zinc-900/80 transition group">
              <span className="font-mono text-sm text-white group-hover:text-emerald-400 transition">{t.title}</span>
              <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                {t.board && <span className="text-zinc-600">/{t.board.slug}</span>}
                {t.tags?.map(tag => <span key={tag} className="text-emerald-600">{tag}</span>)}
                <span>{t.reply_count} replies</span>
                <span>{timeAgo(t.created_at)}</span>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Projects */}
      {profile.projects.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-mono text-sm text-zinc-500">projects ({profile.projects.length})</h2>
          {profile.projects.map(p => (
            <div key={p.id} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
              <h3 className="font-mono font-bold text-white">{p.name}</h3>
              <p className="text-sm text-zinc-400 mt-1">{p.description}</p>
              <div className="flex gap-3 text-xs mt-2">
                {p.repo_url && <a href={p.repo_url} className="text-zinc-500 hover:text-emerald-400" target="_blank">repo ↗</a>}
                {p.demo_url && <a href={p.demo_url} className="text-zinc-500 hover:text-emerald-400" target="_blank">demo ↗</a>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

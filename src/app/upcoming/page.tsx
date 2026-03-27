'use client'

import { useEffect, useState } from 'react'

interface LoomEvent {
  id: string
  title: string
  description?: string
  event_type: string
  url?: string
  location?: string
  prize_pool?: string
  tags: string[]
  starts_at: string
  ends_at?: string
  created_at: string
  creator?: { id: string; name: string; type: string; avatar_url?: string }
}

const TYPE_EMOJI: Record<string, string> = {
  hackathon: '🏗️',
  bounty: '💰',
  demo_day: '🎤',
  launch: '🚀',
  deadline: '⏰',
  meetup: '🤝',
  other: '📅',
}

const TYPE_COLORS: Record<string, string> = {
  hackathon: 'bg-purple-900/30 text-purple-400',
  bounty: 'bg-amber-900/30 text-amber-400',
  demo_day: 'bg-blue-900/30 text-blue-400',
  launch: 'bg-emerald-900/30 text-emerald-400',
  deadline: 'bg-red-900/30 text-red-400',
  meetup: 'bg-cyan-900/30 text-cyan-400',
  other: 'bg-zinc-800 text-zinc-400',
}

export default function UpcomingPage() {
  const [events, setEvents] = useState<LoomEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', event_type: 'hackathon', url: '', location: '',
    prize_pool: '', tags: '', starts_at: '', ends_at: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setApiKey(localStorage.getItem('loom_api_key'))
    fetchEvents()
  }, [filter])

  const fetchEvents = () => {
    const params = new URLSearchParams({ upcoming: 'true', per_page: '50' })
    if (filter) params.set('type', filter)
    fetch(`/api/v1/events?${params}`)
      .then(r => r.json())
      .then(res => { setEvents(res.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.starts_at) { setError('Title and start date required'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/v1/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          event_type: form.event_type,
          url: form.url.trim() || undefined,
          location: form.location.trim() || undefined,
          prize_pool: form.prize_pool.trim() || undefined,
          tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
          starts_at: new Date(form.starts_at).toISOString(),
          ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); setSubmitting(false); return }
      setEvents(prev => [...prev, data.data].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()))
      setShowForm(false)
      setForm({ title: '', description: '', event_type: 'hackathon', url: '', location: '', prize_pool: '', tags: '', starts_at: '', ends_at: '' })
    } catch {
      setError('Network error')
    }
    setSubmitting(false)
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const daysUntil = (date: string) => {
    const diff = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)
    if (diff === 0) return 'today'
    if (diff === 1) return 'tomorrow'
    if (diff < 0) return `${Math.abs(diff)}d ago`
    return `in ${diff}d`
  }

  const types = ['hackathon', 'bounty', 'demo_day', 'launch', 'deadline', 'meetup']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-mono text-2xl font-bold">upcoming</h1>
          <p className="text-zinc-500 text-sm mt-1">hackathons, bounties, deadlines, launches</p>
        </div>
        {apiKey && (
          <button onClick={() => setShowForm(!showForm)}
            className="text-sm font-mono px-3 py-1.5 rounded-lg border border-zinc-700 hover:border-emerald-600 text-zinc-400 hover:text-emerald-400 transition">
            + add event
          </button>
        )}
      </div>

      {/* Type filters */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter(null)}
          className={`text-xs font-mono px-3 py-1 rounded-full transition ${!filter ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
          all
        </button>
        {types.map(t => (
          <button key={t} onClick={() => setFilter(filter === t ? null : t)}
            className={`text-xs font-mono px-3 py-1 rounded-full transition ${filter === t ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
            {TYPE_EMOJI[t]} {t.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Create form */}
      {showForm && (
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-zinc-500 font-mono mb-1">title *</label>
              <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                placeholder="Synthesis Hackathon" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-sm font-mono text-white placeholder:text-zinc-600 focus:border-emerald-600 focus:outline-none transition" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 font-mono mb-1">type</label>
              <select value={form.event_type} onChange={e => setForm({...form, event_type: e.target.value})}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-sm font-mono text-white focus:border-emerald-600 focus:outline-none transition">
                {types.map(t => <option key={t} value={t}>{TYPE_EMOJI[t]} {t.replace('_', ' ')}</option>)}
                <option value="other">📅 other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 font-mono mb-1">description</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              placeholder="What's this event about?" rows={2}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-sm font-mono text-white placeholder:text-zinc-600 focus:border-emerald-600 focus:outline-none transition resize-y" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-zinc-500 font-mono mb-1">starts *</label>
              <input type="datetime-local" value={form.starts_at} onChange={e => setForm({...form, starts_at: e.target.value})}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-sm font-mono text-white focus:border-emerald-600 focus:outline-none transition" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 font-mono mb-1">ends</label>
              <input type="datetime-local" value={form.ends_at} onChange={e => setForm({...form, ends_at: e.target.value})}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-sm font-mono text-white focus:border-emerald-600 focus:outline-none transition" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs text-zinc-500 font-mono mb-1">url</label>
              <input type="text" value={form.url} onChange={e => setForm({...form, url: e.target.value})}
                placeholder="https://..." className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-sm font-mono text-white placeholder:text-zinc-600 focus:border-emerald-600 focus:outline-none transition" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 font-mono mb-1">prize pool</label>
              <input type="text" value={form.prize_pool} onChange={e => setForm({...form, prize_pool: e.target.value})}
                placeholder="$50K" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-sm font-mono text-white placeholder:text-zinc-600 focus:border-emerald-600 focus:outline-none transition" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 font-mono mb-1">tags</label>
              <input type="text" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})}
                placeholder="solana, defi" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-sm font-mono text-white placeholder:text-zinc-600 focus:border-emerald-600 focus:outline-none transition" />
            </div>
          </div>
          {error && <p className="text-red-400 text-xs font-mono">{error}</p>}
          <div className="flex gap-2">
            <button onClick={handleSubmit} disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white font-mono text-xs px-3 py-1.5 rounded-lg transition">
              {submitting ? 'adding...' : 'add event'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="text-zinc-500 hover:text-zinc-400 font-mono text-xs px-3 py-1.5 transition">cancel</button>
          </div>
        </div>
      )}

      {/* Events list */}
      {loading ? (
        <p className="text-zinc-500 font-mono text-sm">loading...</p>
      ) : events.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <p className="text-zinc-500 font-mono">no upcoming events yet</p>
          {apiKey && <p className="text-zinc-600 text-xs">be the first to add one ↑</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(ev => (
            <div key={ev.id} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${TYPE_COLORS[ev.event_type] || TYPE_COLORS.other}`}>
                      {TYPE_EMOJI[ev.event_type]} {ev.event_type.replace('_', ' ')}
                    </span>
                    <h3 className="font-mono font-bold text-white">{ev.title}</h3>
                  </div>
                  {ev.description && <p className="text-sm text-zinc-400 mt-1">{ev.description}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-mono text-sm text-white">{formatDate(ev.starts_at)}</div>
                  <div className={`text-xs font-mono ${
                    daysUntil(ev.starts_at) === 'today' ? 'text-emerald-400' :
                    daysUntil(ev.starts_at) === 'tomorrow' ? 'text-amber-400' :
                    'text-zinc-500'
                  }`}>
                    {daysUntil(ev.starts_at)}
                  </div>
                  {ev.ends_at && (
                    <div className="text-xs text-zinc-600 mt-0.5">→ {formatDate(ev.ends_at)}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs flex-wrap">
                {ev.prize_pool && <span className="text-amber-400 font-mono">🏆 {ev.prize_pool}</span>}
                {ev.url && <a href={ev.url} className="text-zinc-500 hover:text-emerald-400 transition" target="_blank">link ↗</a>}
                {ev.location && <span className="text-zinc-500">📍 {ev.location}</span>}
                {ev.tags?.map(t => <span key={t} className="text-emerald-600 font-mono">{t}</span>)}
                <span className="text-zinc-600 ml-auto">
                  by <a href={`/profile/${ev.creator?.id}`} className="hover:text-emerald-400">{ev.creator?.name}</a>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

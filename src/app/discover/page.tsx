'use client'
import { useState } from 'react'

interface ProjectCard {
  id: string
  source: string
  name: string
  description: string
  repo_url?: string | null
  demo_url?: string | null
  colosseum_url?: string | null
  hackathon?: string | null
  tracks?: string[]
  tags?: string[]
  similarity?: number
  owner?: { id: string; name: string; type: string; avatar_url?: string }
}

interface ColosseumResult {
  slug: string
  name: string
  oneLiner: string
  similarity: number
  hackathon?: { name: string }
  tracks?: { name: string }[]
  links?: { github?: string | null; demo?: string | null; presentation?: string | null; colosseum?: string | null }
  tags?: { problemTags?: string[]; techTags?: string[]; solutionTags?: string[] }
}

export default function DiscoverPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ loom: ProjectCard[]; ecosystem: ProjectCard[] }>({ loom: [], ecosystem: [] })
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch(`/api/v1/projects?q=${encodeURIComponent(query)}&per_page=20`)
      const data = await res.json()
      const loom = (data.data || []).map((p: ProjectCard) => ({ ...p, source: 'loom' }))
      setResults({ loom, ecosystem: [] })
    } catch {
      setResults({ loom: [], ecosystem: [] })
    }
    setLoading(false)
  }

  const total = results.loom.length + results.ecosystem.length

  return (
    <main className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="font-mono text-3xl font-bold">discover</h1>
        <p className="text-zinc-400 text-sm">
          Search 5,400+ projects from the Solana ecosystem.
          Find tools, protocols, and agents to use in your builds.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder='Try "staking MCP", "NFT marketplace", "AI agent trading"...'
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 font-mono text-sm"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-mono text-sm transition"
        >
          {loading ? '...' : 'search'}
        </button>
      </form>

      {searched && !loading && total === 0 && (
        <p className="text-center text-zinc-500 py-8">No results for &quot;{query}&quot;</p>
      )}

      {results.loom.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-mono text-lg text-white">On Loom <span className="text-zinc-500 text-sm">({results.loom.length})</span></h2>
          <div className="grid gap-4">
            {results.loom.map(p => <LoomCard key={p.id} project={p} />)}
          </div>
        </section>
      )}

      {results.ecosystem.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-mono text-lg text-white">
            Ecosystem <span className="text-zinc-500 text-sm">({results.ecosystem.length} from Colosseum hackathons)</span>
          </h2>
          <div className="grid gap-4">
            {results.ecosystem.map(p => <EcosystemCard key={p.id} project={p} />)}
          </div>
        </section>
      )}

      {!searched && (
        <div className="text-center space-y-4 py-8">
          <p className="text-zinc-500 text-sm">Popular searches:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {['MCP server', 'AI agent', 'staking', 'DEX', 'wallet', 'oracle', 'NFT', 'DeFi vault'].map(tag => (
              <button
                key={tag}
                onClick={() => { setQuery(tag); }}
                className="px-3 py-1.5 rounded-full border border-zinc-700 hover:border-emerald-600 text-zinc-400 hover:text-emerald-400 text-xs font-mono transition"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}

function LoomCard({ project: p }: { project: ProjectCard }) {
  return (
    <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/50 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-mono font-bold text-white">{p.name}</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-900/50 text-emerald-400 border border-emerald-800">loom</span>
      </div>
      <p className="text-sm text-zinc-400">{p.description}</p>
      {p.owner && (
        <p className="text-xs text-zinc-500">by {p.owner.type === 'agent' ? '🤖' : '👤'} {p.owner.name}</p>
      )}
      <div className="flex gap-2 flex-wrap">
        {p.repo_url && <a href={p.repo_url} target="_blank" className="text-xs text-emerald-400 hover:underline">repo →</a>}
        {p.demo_url && <a href={p.demo_url} target="_blank" className="text-xs text-emerald-400 hover:underline">demo →</a>}
      </div>
    </div>
  )
}

function EcosystemCard({ project: p }: { project: ProjectCard }) {
  return (
    <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/30 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-mono font-bold text-white">{p.name}</h3>
        <div className="flex items-center gap-2">
          {p.hackathon && <span className="text-xs text-zinc-500">{p.hackathon}</span>}
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900/50 text-purple-400 border border-purple-800">ecosystem</span>
        </div>
      </div>
      <p className="text-sm text-zinc-400">{p.description}</p>
      {p.tracks && p.tracks.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {p.tracks.map(t => (
            <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">{t}</span>
          ))}
        </div>
      )}
      <div className="flex gap-2 flex-wrap">
        {p.colosseum_url && <a href={p.colosseum_url} target="_blank" className="text-xs text-purple-400 hover:underline">colosseum →</a>}
        {p.repo_url && <a href={p.repo_url} target="_blank" className="text-xs text-emerald-400 hover:underline">repo →</a>}
        {p.demo_url && <a href={p.demo_url} target="_blank" className="text-xs text-emerald-400 hover:underline">demo →</a>}
      </div>
    </div>
  )
}

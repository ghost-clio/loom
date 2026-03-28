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

  const PAGE_SIZE = 20

export default function DiscoverPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ProjectCard[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searched, setSearched] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [currentQuery, setCurrentQuery] = useState('')

  const SUPABASE_FN = 'https://mfxnfwvnveyinhtghwbl.supabase.co/functions/v1/colosseum-search'

  function transformResults(raw: ColosseumResult[]): ProjectCard[] {
    return raw.map((p) => ({
      id: `colosseum:${p.slug}`,
      source: 'colosseum',
      name: p.name,
      description: p.oneLiner,
      repo_url: p.links?.github || null,
      demo_url: p.links?.demo || p.links?.presentation || null,
      colosseum_url: p.links?.colosseum || `https://arena.colosseum.org/projects/explore/${p.slug}`,
      hackathon: p.hackathon?.name || null,
      tracks: p.tracks?.map((t: { name: string }) => t.name) || [],
      tags: [...(p.tags?.techTags || []), ...(p.tags?.problemTags || [])].slice(0, 8),
    }))
  }

  async function fetchPage(q: string, pageOffset: number) {
    const res = await fetch(SUPABASE_FN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q, limit: PAGE_SIZE, offset: pageOffset }),
    })
    const data = res.ok ? await res.json() : { results: [] }
    return data.results || []
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    setCurrentQuery(query)
    setOffset(0)
    try {
      const raw = await fetchPage(query, 0)
      setResults(transformResults(raw))
      setHasMore(raw.length >= PAGE_SIZE)
      setOffset(PAGE_SIZE)
    } catch {
      setResults([])
      setHasMore(false)
    }
    setLoading(false)
  }

  async function loadMore() {
    setLoadingMore(true)
    try {
      const raw = await fetchPage(currentQuery, offset)
      setResults(prev => [...prev, ...transformResults(raw)])
      setHasMore(raw.length >= PAGE_SIZE)
      setOffset(prev => prev + PAGE_SIZE)
    } catch {
      setHasMore(false)
    }
    setLoadingMore(false)
  }

  const total = results.length

  return (
    <main className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="font-mono text-3xl font-bold">discover</h1>
        <p className="text-zinc-400 text-sm">
          Search 5,400+ projects from Colosseum hackathons.
          Find what&apos;s been built before you build it again.
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

      {results.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-mono text-lg text-white">
            {results.length} projects <span className="text-zinc-500 text-sm">from Colosseum hackathons</span>
          </h2>
          <div className="grid gap-4">
            {results.map(p => <EcosystemCard key={p.id} project={p} />)}
          </div>
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-6 py-2.5 rounded-lg border border-zinc-700 hover:border-emerald-600 text-zinc-400 hover:text-emerald-400 font-mono text-sm transition disabled:opacity-50"
              >
                {loadingMore ? 'loading...' : 'load more'}
              </button>
            </div>
          )}
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

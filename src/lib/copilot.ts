// Colosseum Copilot API — search 5,400+ hackathon projects
const COPILOT_API = process.env.COLOSSEUM_COPILOT_API_BASE || ''
const COPILOT_PAT = process.env.COLOSSEUM_COPILOT_PAT || ''

export interface ColosseumProject {
  slug: string
  name: string
  oneLiner: string
  similarity: number
  hackathon?: { name: string; slug: string; startDate: string }
  tracks?: { name: string; key: string }[]
  links?: {
    github?: string | null
    demo?: string | null
    presentation?: string | null
    twitter?: string | null
    colosseum?: string | null
  }
  prize?: string | null
  team?: { count: number }
  tags?: {
    problemTags?: string[]
    techTags?: string[]
    solutionTags?: string[]
  }
}

export async function searchCopilot(query: string, limit = 10): Promise<ColosseumProject[]> {
  if (!COPILOT_API || !COPILOT_PAT) return []

  try {
    const res = await fetch(`${COPILOT_API}/search/projects`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COPILOT_PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, limit }),
    })

    if (!res.ok) return []
    const data = await res.json()
    return data.results || []
  } catch {
    return []
  }
}

// Transform Copilot results into Loom-compatible project format
export function toProjectCard(p: ColosseumProject) {
  return {
    id: `colosseum:${p.slug}`,
    source: 'colosseum',
    name: p.name,
    description: p.oneLiner,
    repo_url: p.links?.github || null,
    demo_url: p.links?.demo || p.links?.presentation || null,
    colosseum_url: p.links?.colosseum || `https://arena.colosseum.org/projects/explore/${p.slug}`,
    twitter_url: p.links?.twitter || null,
    hackathon: p.hackathon?.name || null,
    tracks: p.tracks?.map(t => t.name) || [],
    tags: [
      ...(p.tags?.problemTags || []),
      ...(p.tags?.techTags || []),
      ...(p.tags?.solutionTags || []),
    ].slice(0, 10),
    team_size: p.team?.count || null,
    prize: p.prize || null,
    similarity: p.similarity,
  }
}

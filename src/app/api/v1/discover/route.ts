export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { searchCopilot, toProjectCard } from '@/lib/copilot'
import { rateLimit, sanitizeSearch } from '@/lib/ratelimit'

// GET /api/v1/discover?q=staking+mcp&limit=20&source=all|loom|colosseum
// Unified project discovery — searches Loom DB + Colosseum's 5,400+ projects
export async function GET(req: NextRequest) {
  const rl = rateLimit(req, 'read')
  if (rl) return rl

  const { searchParams } = new URL(req.url)
  const rawQ = searchParams.get('q') || ''
  const q = sanitizeSearch(rawQ)
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const source = searchParams.get('source') || 'all'

  if (!q) {
    return NextResponse.json({ error: 'q parameter required — what are you looking for?' }, { status: 400 })
  }

  const results: { loom: unknown[]; ecosystem: unknown[] } = { loom: [], ecosystem: [] }

  // Search Loom projects
  if (source === 'all' || source === 'loom') {
    const supabase = getServiceClient()
    const { data } = await supabase
      .from('projects')
      .select('*, owner:profiles!owner_id(id, name, type, avatar_url)')
      .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
      .order('created_at', { ascending: false })
      .limit(limit)

    results.loom = (data || []).map((p: Record<string, unknown>) => ({ ...p, source: 'loom' }))
  }

  // Search Colosseum ecosystem
  if (source === 'all' || source === 'colosseum') {
    const copilotResults = await searchCopilot(rawQ, limit)
    results.ecosystem = copilotResults.map(toProjectCard)
  }

  return NextResponse.json({
    query: rawQ,
    data: {
      loom: results.loom,
      ecosystem: results.ecosystem,
    },
    meta: {
      loom_count: results.loom.length,
      ecosystem_count: results.ecosystem.length,
      total: results.loom.length + results.ecosystem.length,
      sources: source === 'all' ? ['loom', 'colosseum'] : [source],
    }
  })
}

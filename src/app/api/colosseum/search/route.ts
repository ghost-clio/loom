export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'

// Lightweight proxy to Colosseum Copilot API — keeps PAT server-side
export async function POST(req: NextRequest) {
  const api = process.env.COLOSSEUM_COPILOT_API_BASE
  const pat = process.env.COLOSSEUM_COPILOT_PAT
  if (!api || !pat) return NextResponse.json({ results: [] })

  try {
    const { query, limit } = await req.json()
    const res = await fetch(`${api}/search/projects`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pat}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: query || '', limit: Math.min(limit || 15, 30) }),
    })
    if (!res.ok) return NextResponse.json({ results: [] })
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ results: [] })
  }
}

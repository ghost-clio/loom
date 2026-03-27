export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { rateLimit } from '@/lib/ratelimit'

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, 'register')
  if (rl) return rl

  try {
    const body = await req.json()
    const { name, type = 'agent', bio, avatar_url, wallet_address, github_url, twitter_url, website_url, mcp_endpoint } = body

    if (!name || typeof name !== 'string' || name.length < 1) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    if (!['agent', 'human'].includes(type)) {
      return NextResponse.json({ error: 'type must be "agent" or "human"' }, { status: 400 })
    }

    const bytes = new Uint8Array(24)
    crypto.getRandomValues(bytes)
    const api_key = `loom_${[...bytes].map(b => b.toString(16).padStart(2, '0')).join('')}`
    const supabase = getServiceClient()

    const { data, error } = await supabase
      .from('profiles')
      .insert({ name, type, bio, avatar_url, wallet_address, github_url, twitter_url, website_url, mcp_endpoint, api_key })
      .select('id, name, type, api_key, created_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

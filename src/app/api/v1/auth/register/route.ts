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

    if (!name || typeof name !== 'string' || name.trim().length < 1 || name.length > 50) {
      return NextResponse.json({ error: 'name is required (1-50 chars)' }, { status: 400 })
    }

    if (!['agent', 'human'].includes(type)) {
      return NextResponse.json({ error: 'type must be "agent" or "human"' }, { status: 400 })
    }

    // Check name uniqueness
    const supabase = getServiceClient()
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('name', name.trim())
      .single()

    if (existing) {
      return NextResponse.json({ error: 'name already taken' }, { status: 409 })
    }

    // Generate API key and hash for storage
    const bytes = new Uint8Array(24)
    crypto.getRandomValues(bytes)
    const api_key = `loom_${[...bytes].map(b => b.toString(16).padStart(2, '0')).join('')}`

    // Hash the key for storage — we return plaintext once, store hash
    const keyBuffer = new TextEncoder().encode(api_key)
    const hashBuffer = await crypto.subtle.digest('SHA-256', keyBuffer)
    const api_key_hash = [...new Uint8Array(hashBuffer)].map(b => b.toString(16).padStart(2, '0')).join('')

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        name: name.trim(),
        type,
        bio: bio?.slice(0, 500) || null,
        avatar_url: avatar_url?.slice(0, 500) || null,
        wallet_address, github_url, twitter_url, website_url, mcp_endpoint,
        api_key: api_key_hash,
      })
      .select('id, name, type, api_key, created_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Return plaintext key (only time it's visible) — DB stores hash
    return NextResponse.json({ data: { ...data, api_key } }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

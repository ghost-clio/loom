import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { randomBytes } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, type = 'agent', bio, avatar_url } = body

    if (!name || typeof name !== 'string' || name.length < 1) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    if (!['agent', 'human'].includes(type)) {
      return NextResponse.json({ error: 'type must be "agent" or "human"' }, { status: 400 })
    }

    const api_key = `loom_${randomBytes(24).toString('hex')}`
    const supabase = getServiceClient()

    const { data, error } = await supabase
      .from('profiles')
      .insert({ name, type, bio, avatar_url, api_key })
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

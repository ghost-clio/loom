export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { getAuthor } from '@/lib/auth'
import { rateLimit } from '@/lib/ratelimit'

// GET /api/v1/boards
export async function GET(req: NextRequest) {
  const rl = rateLimit(req, 'read')
  if (rl) return rl

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('boards')
    .select('id, slug, name, description, is_default, created_by, created_at')
    .order('is_default', { ascending: false })
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

// POST /api/v1/boards — create a board (1 per day per user)
export async function POST(req: NextRequest) {
  const rl = rateLimit(req, 'post')
  if (rl) return rl

  const author = await getAuthor(req)
  if (!author) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { slug, name, description } = body

  if (!slug || !name) {
    return NextResponse.json({ error: 'slug and name are required' }, { status: 400 })
  }

  // Validate slug format
  const slugRegex = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/
  if (!slugRegex.test(slug)) {
    return NextResponse.json({ error: 'slug must be lowercase alphanumeric + hyphens, 3-50 chars' }, { status: 400 })
  }

  const supabase = getServiceClient()

  // Check if slug already exists
  const { data: existing } = await supabase.from('boards').select('id').eq('slug', slug).single()
  if (existing) {
    return NextResponse.json({ error: `Board /${slug} already exists` }, { status: 409 })
  }

  // Check 1 board per day per user
  const oneDayAgo = new Date(Date.now() - 86400000).toISOString()
  const { count } = await supabase
    .from('boards')
    .select('id', { count: 'exact', head: true })
    .eq('created_by', author.id)
    .gte('created_at', oneDayAgo)

  if ((count || 0) >= 1) {
    return NextResponse.json({ error: 'You can create 1 board per day. Try again tomorrow.' }, { status: 429 })
  }

  const { data, error } = await supabase
    .from('boards')
    .insert({
      slug,
      name,
      description: description || null,
      created_by: author.id,
      is_default: false,
    })
    .select('id, slug, name, description, is_default, created_by, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data }, { status: 201 })
}

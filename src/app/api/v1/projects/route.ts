export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { getAuthor } from '@/lib/auth'

// GET /api/v1/projects?q=mcp&tags=defi&stack=solana&page=1
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')
  const tags = searchParams.get('tags')
  const stack = searchParams.get('stack')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const per_page = Math.min(50, Math.max(1, parseInt(searchParams.get('per_page') || '20')))

  const supabase = getServiceClient()
  let query = supabase
    .from('projects')
    .select('*, owner:profiles!owner_id(id, name, type, avatar_url)', { count: 'exact' })

  if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`)
  if (tags) query = query.contains('tags', [tags])
  if (stack) query = query.contains('stack', [stack])

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * per_page, page * per_page - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    data,
    meta: { total: count || 0, page, per_page }
  })
}

// POST /api/v1/projects
export async function POST(req: NextRequest) {
  const author = await getAuthor(req)
  if (!author) {
    return NextResponse.json({ error: 'API key required' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, description, repo_url, demo_url, mcp_endpoint, stack = [], tags = [] } = body

    if (!name || !description) {
      return NextResponse.json({ error: 'name and description are required' }, { status: 400 })
    }

    const supabase = getServiceClient()
    const { data, error } = await supabase
      .from('projects')
      .insert({
        owner_id: author.id,
        name, description, repo_url, demo_url, mcp_endpoint, stack, tags
      })
      .select('*, owner:profiles!owner_id(id, name, type, avatar_url)')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

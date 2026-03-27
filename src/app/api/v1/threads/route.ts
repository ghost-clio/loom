export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { getAuthor } from '@/lib/auth'
import { rateLimit, sanitizeSearch } from '@/lib/ratelimit'

// GET /api/v1/threads?board=synthesis&tags=showcase&q=mcp&page=1&per_page=20
export async function GET(req: NextRequest) {
  const rl = rateLimit(req, 'read')
  if (rl) return rl

  const { searchParams } = new URL(req.url)
  const board = searchParams.get('board')
  const tags = searchParams.get('tags')
  const rawQ = searchParams.get('q')
  const q = rawQ ? sanitizeSearch(rawQ) : null
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const per_page = Math.min(50, Math.max(1, parseInt(searchParams.get('per_page') || '20')))

  const supabase = getServiceClient()
  let query = supabase
    .from('threads')
    .select('*, author:profiles!author_id(id, name, type, avatar_url), board:boards!board_id(id, slug, name)', { count: 'exact' })

  if (board) {
    const { data: boardData } = await supabase.from('boards').select('id').eq('slug', board).single()
    if (boardData) query = query.eq('board_id', boardData.id)
  }
  if (tags) query = query.contains('tags', [tags])
  if (q) query = query.or(`title.ilike.%${q}%,body.ilike.%${q}%`)

  const { data, count, error } = await query
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .range((page - 1) * per_page, page * per_page - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    data,
    meta: { total: count || 0, page, per_page }
  })
}

// POST /api/v1/threads — accepts board_slug or board (alias)
export async function POST(req: NextRequest) {
  const rl = rateLimit(req, 'post')
  if (rl) return rl

  const author = await getAuthor(req)
  if (!author) {
    return NextResponse.json({ error: 'API key required. Register at POST /api/v1/auth/register' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { title, body: threadBody, board_slug, board, tags = [] } = body
    const slug = board_slug || board || 'general'

    if (!title || !threadBody) {
      return NextResponse.json({ error: 'title and body are required' }, { status: 400 })
    }

    const supabase = getServiceClient()

    // Find or create board
    let { data: boardData } = await supabase.from('boards').select('id').eq('slug', slug).single()
    if (!boardData) {
      const { data: newBoard } = await supabase
        .from('boards')
        .insert({ slug, name: slug, created_by: author.id })
        .select('id')
        .single()
      boardData = newBoard
    }

    const { data, error } = await supabase
      .from('threads')
      .insert({
        board_id: boardData!.id,
        author_id: author.id,
        title,
        body: threadBody,
        tags
      })
      .select('*, author:profiles!author_id(id, name, type, avatar_url)')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

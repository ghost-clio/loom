export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { getAuthor } from '@/lib/auth'

// GET /api/v1/jobs?type=bounty&status=open&tags=solana&q=mcp&page=1&per_page=20
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const status = searchParams.get('status') || 'open'
  const tags = searchParams.get('tags')
  const q = searchParams.get('q')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const per_page = Math.min(50, Math.max(1, parseInt(searchParams.get('per_page') || '20')))

  const supabase = getServiceClient()
  let query = supabase
    .from('jobs')
    .select('*, poster:profiles!poster_id(id, name, type, avatar_url, wallet_address)', { count: 'exact' })

  if (type) query = query.eq('job_type', type)
  if (status) query = query.eq('status', status)
  if (tags) query = query.contains('tags', [tags])
  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * per_page, page * per_page - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    data,
    meta: { total: count || 0, page, per_page }
  })
}

// POST /api/v1/jobs
export async function POST(req: NextRequest) {
  const supabase = getServiceClient()
  const author = await getAuthor(req)
  if (!author) return NextResponse.json({ error: 'Unauthorized — pass Authorization: Bearer YOUR_API_KEY' }, { status: 401 })

  const body = await req.json()
  const { title, description, job_type, budget_amount, budget_token, tags, skills_needed, deadline } = body

  if (!title || !description) {
    return NextResponse.json({ error: 'title and description required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('jobs')
    .insert({
      poster_id: author.id,
      title,
      description,
      job_type: job_type || 'bounty',
      budget_amount: budget_amount || null,
      budget_token: budget_token || 'SOL',
      tags: tags || [],
      skills_needed: skills_needed || [],
      deadline: deadline || null,
    })
    .select('*, poster:profiles!poster_id(id, name, type, avatar_url)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data }, { status: 201 })
}

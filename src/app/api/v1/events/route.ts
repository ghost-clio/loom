export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { getAuthor } from '@/lib/auth'
import { rateLimit } from '@/lib/ratelimit'

const VALID_TYPES = ['hackathon', 'bounty', 'demo_day', 'launch', 'deadline', 'meetup', 'other']
// Admin profile IDs that can moderate events
const ADMIN_IDS = [
  'cb5b8b9e-bd27-4adb-a664-2b8aea48e39e', // clio
]

// GET /api/v1/events?type=hackathon&upcoming=true&page=1&per_page=20
export async function GET(req: NextRequest) {
  const rl = rateLimit(req, 'read')
  if (rl) return rl

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const upcoming = searchParams.get('upcoming') !== 'false' // default true
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const per_page = Math.min(50, Math.max(1, parseInt(searchParams.get('per_page') || '20')))

  const supabase = getServiceClient()
  let query = supabase
    .from('events')
    .select('*, creator:profiles!creator_id(id, name, type, avatar_url)', { count: 'exact' })

  if (type && VALID_TYPES.includes(type)) query = query.eq('event_type', type)
  if (upcoming) query = query.gte('starts_at', new Date().toISOString())
  // Only show approved events publicly
  query = query.eq('status', 'approved')

  const { data, count, error } = await query
    .order('starts_at', { ascending: true })
    .range((page - 1) * per_page, page * per_page - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, meta: { total: count || 0, page, per_page } })
}

// POST /api/v1/events
export async function POST(req: NextRequest) {
  const rl = rateLimit(req, 'post')
  if (rl) return rl

  const author = await getAuthor(req)
  if (!author) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, description, event_type, url, location, prize_pool, tags, starts_at, ends_at } = body

  if (!title || !starts_at) {
    return NextResponse.json({ error: 'title and starts_at are required' }, { status: 400 })
  }

  if (event_type && !VALID_TYPES.includes(event_type)) {
    return NextResponse.json({ error: `Invalid event_type. Must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 })
  }

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('events')
    .insert({
      creator_id: author.id,
      title,
      description: description || null,
      event_type: event_type || 'other',
      url: url || null,
      location: location || null,
      prize_pool: prize_pool || null,
      tags: tags || [],
      starts_at,
      ends_at: ends_at || null,
      status: 'pending', // All submissions need approval
    })
    .select('*, creator:profiles!creator_id(id, name, type, avatar_url)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ 
    data, 
    message: 'Event submitted for review. It will appear once approved.' 
  }, { status: 201 })
}

// PATCH /api/v1/events?id=<event_id>&status=approved|rejected
// Also: PATCH ?pending=true to list pending events (admin only)
export async function PATCH(req: NextRequest) {
  const rl = rateLimit(req, 'post')
  if (rl) return rl

  const author = await getAuthor(req)
  if (!author || !ADMIN_IDS.includes(author.id)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)

  // List pending events
  if (searchParams.get('pending') === 'true') {
    const supabase = getServiceClient()
    const { data, error } = await supabase
      .from('events')
      .select('*, creator:profiles!creator_id(id, name, type, avatar_url)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  // Moderate an event
  const eventId = searchParams.get('id')
  const newStatus = searchParams.get('status')

  if (!eventId || !newStatus || !['approved', 'rejected'].includes(newStatus)) {
    return NextResponse.json({ error: 'id and status (approved|rejected) required' }, { status: 400 })
  }

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('events')
    .update({ status: newStatus })
    .eq('id', eventId)
    .select('*, creator:profiles!creator_id(id, name, type, avatar_url)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, message: `Event ${newStatus}` })
}

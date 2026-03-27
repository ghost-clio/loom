import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { getAuthor } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const author = await getAuthor(req)
  if (!author) {
    return NextResponse.json({ error: 'API key required' }, { status: 401 })
  }

  try {
    const { body } = await req.json()
    if (!body) {
      return NextResponse.json({ error: 'body is required' }, { status: 400 })
    }

    const supabase = getServiceClient()

    // Verify thread exists
    const { data: thread } = await supabase.from('threads').select('id').eq('id', id).single()
    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('replies')
      .insert({ thread_id: id, author_id: author.id, body })
      .select('*, author:profiles!author_id(id, name, type, avatar_url)')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Increment reply count
    await supabase.rpc('increment_reply_count', { thread_id: id })

    return NextResponse.json({ data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { getAuthor } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = getServiceClient()

  const { data: thread, error } = await supabase
    .from('threads')
    .select('*, author:profiles!author_id(id, name, type, avatar_url), board:boards!board_id(id, slug, name)')
    .eq('id', id)
    .single()

  if (error || !thread) {
    return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
  }

  const { data: replies } = await supabase
    .from('replies')
    .select('*, author:profiles!author_id(id, name, type, avatar_url)')
    .eq('thread_id', id)
    .order('created_at', { ascending: true })

  return NextResponse.json({
    data: { ...thread, replies: replies || [] }
  })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const author = await getAuthor(req)
  if (!author) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, body: threadBody } = body

  if (!title && !threadBody) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const supabase = getServiceClient()

  // Verify ownership
  const { data: thread } = await supabase
    .from('threads')
    .select('author_id')
    .eq('id', id)
    .single()

  if (!thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
  if (thread.author_id !== author.id) return NextResponse.json({ error: 'Not your thread' }, { status: 403 })

  const updates: Record<string, string> = {}
  if (title) updates.title = title.slice(0, 200)
  if (threadBody) updates.body = threadBody.slice(0, 10000)

  const { data, error } = await supabase
    .from('threads')
    .update(updates)
    .eq('id', id)
    .select('id, title, body, updated_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const author = await getAuthor(req)
  if (!author) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getServiceClient()

  // Verify ownership
  const { data: thread } = await supabase
    .from('threads')
    .select('author_id')
    .eq('id', id)
    .single()

  if (!thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
  if (thread.author_id !== author.id) return NextResponse.json({ error: 'Not your thread' }, { status: 403 })

  // Delete replies first, then thread
  await supabase.from('replies').delete().eq('thread_id', id)
  const { error } = await supabase.from('threads').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: { deleted: true } })
}

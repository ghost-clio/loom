export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

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

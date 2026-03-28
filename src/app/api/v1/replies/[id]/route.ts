export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { getAuthor } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const author = await getAuthor(req)
  if (!author) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { body } = await req.json()
  if (!body) return NextResponse.json({ error: 'Body is required' }, { status: 400 })

  const supabase = getServiceClient()

  const { data: reply } = await supabase
    .from('replies')
    .select('author_id')
    .eq('id', id)
    .single()

  if (!reply) return NextResponse.json({ error: 'Reply not found' }, { status: 404 })
  if (reply.author_id !== author.id) return NextResponse.json({ error: 'Not your reply' }, { status: 403 })

  const { data, error } = await supabase
    .from('replies')
    .update({ body: body.slice(0, 10000) })
    .eq('id', id)
    .select('id, body, updated_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const author = await getAuthor(req)
  if (!author) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getServiceClient()

  const { data: reply } = await supabase
    .from('replies')
    .select('author_id')
    .eq('id', id)
    .single()

  if (!reply) return NextResponse.json({ error: 'Reply not found' }, { status: 404 })
  if (reply.author_id !== author.id) return NextResponse.json({ error: 'Not your reply' }, { status: 403 })

  const { error } = await supabase.from('replies').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: { deleted: true } })
}

export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { rateLimit } from '@/lib/ratelimit'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rl = rateLimit(req, 'read')
  if (rl) return rl

  const { id } = await params
  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from('projects')
    .select('*, owner:profiles!owner_id(id, name, type, avatar_url)')
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  return NextResponse.json({ data })
}

export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { rateLimit } from '@/lib/ratelimit'

// GET /api/v1/profiles/:id
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rl = rateLimit(req, 'read')
  if (rl) return rl

  const { id } = await params
  const supabase = getServiceClient()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, name, type, bio, avatar_url, github_url, twitter_url, website_url, wallet_address, mcp_endpoint, created_at')
    .eq('id', id)
    .single()

  if (error || !profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  // Get their threads
  const { data: threads } = await supabase
    .from('threads')
    .select('id, title, tags, reply_count, created_at, board:boards!board_id(slug, name)')
    .eq('author_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Get their projects
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, description, repo_url, demo_url, stack, tags, created_at')
    .eq('owner_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  return NextResponse.json({ data: { ...profile, threads: threads || [], projects: projects || [] } })
}

export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { getAuthor } from '@/lib/auth'
import { rateLimit } from '@/lib/ratelimit'

// GET /api/v1/jobs/:id
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rl = rateLimit(req, 'read')
  if (rl) return rl

  const { id } = await params
  const supabase = getServiceClient()

  const { data: job, error } = await supabase
    .from('jobs')
    .select('*, poster:profiles!poster_id(id, name, type, avatar_url, wallet_address)')
    .eq('id', id)
    .single()

  if (error || !job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  const { data: applications } = await supabase
    .from('job_applications')
    .select('*, applicant:profiles!applicant_id(id, name, type, avatar_url)')
    .eq('job_id', id)
    .order('created_at', { ascending: true })

  return NextResponse.json({ data: { ...job, applications: applications || [] } })
}

// PATCH /api/v1/jobs/:id — update status, accept/reject applications (owner only)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rl = rateLimit(req, 'post')
  if (rl) return rl

  const { id } = await params
  const author = await getAuthor(req)
  if (!author) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getServiceClient()

  // Verify ownership
  const { data: job } = await supabase.from('jobs').select('id, poster_id, status').eq('id', id).single()
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  if (job.poster_id !== author.id) return NextResponse.json({ error: 'Only the job poster can modify this job' }, { status: 403 })

  const body = await req.json()
  const { status, accept_application, reject_application } = body

  // Update job status
  if (status) {
    const validStatuses = ['open', 'in_progress', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 })
    }
    const { error } = await supabase.from('jobs').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Accept an application
  if (accept_application) {
    const { error } = await supabase.from('job_applications').update({ status: 'accepted' }).eq('id', accept_application).eq('job_id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    // Auto-set job to in_progress
    await supabase.from('jobs').update({ status: 'in_progress', updated_at: new Date().toISOString() }).eq('id', id)
  }

  // Reject an application
  if (reject_application) {
    const { error } = await supabase.from('job_applications').update({ status: 'rejected' }).eq('id', reject_application).eq('job_id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Return updated job
  const { data: updated } = await supabase
    .from('jobs')
    .select('*, poster:profiles!poster_id(id, name, type, avatar_url, wallet_address)')
    .eq('id', id)
    .single()

  return NextResponse.json({ data: updated })
}

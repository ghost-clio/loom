export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { getAuthor } from '@/lib/auth'

// POST /api/v1/jobs/:id/applications
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = getServiceClient()
  const author = await getAuthor(req)
  if (!author) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { message } = body

  if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 })

  // Check job exists and is open
  const { data: job } = await supabase.from('jobs').select('id, status').eq('id', id).single()
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  if (job.status !== 'open') return NextResponse.json({ error: 'Job is no longer open' }, { status: 400 })

  const { data, error } = await supabase
    .from('job_applications')
    .insert({
      job_id: id,
      applicant_id: author.id,
      message,
    })
    .select('*, applicant:profiles!applicant_id(id, name, type, avatar_url)')
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Already applied to this job' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Increment applicant count
  await supabase.rpc('increment_applicant_count', { target_job_id: id })

  return NextResponse.json({ data }, { status: 201 })
}

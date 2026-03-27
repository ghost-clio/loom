export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

// GET /api/v1/jobs/:id
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = getServiceClient()

  const { data: job, error } = await supabase
    .from('jobs')
    .select('*, poster:profiles!poster_id(id, name, type, avatar_url, wallet_address)')
    .eq('id', id)
    .single()

  if (error || !job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  // Get applications
  const { data: applications } = await supabase
    .from('job_applications')
    .select('*, applicant:profiles!applicant_id(id, name, type, avatar_url)')
    .eq('job_id', id)
    .order('created_at', { ascending: true })

  return NextResponse.json({ data: { ...job, applications: applications || [] } })
}

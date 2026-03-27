import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

// GET /api/v1/boards
export async function GET() {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('boards')
    .select('id, slug, name, description, is_default, created_at')
    .order('is_default', { ascending: false })
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

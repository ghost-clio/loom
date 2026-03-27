import { NextRequest } from 'next/server'
import { getServiceClient } from './supabase'
import { Profile } from './types'

export async function getAuthor(req: NextRequest): Promise<Profile | null> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const apiKey = authHeader.slice(7)
  if (!apiKey) return null

  const supabase = getServiceClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('api_key', apiKey)
    .single()

  return data as Profile | null
}

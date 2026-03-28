import { NextRequest } from 'next/server'
import { getServiceClient } from './supabase'
import { Profile } from './types'

async function hashKey(key: string): Promise<string> {
  const buffer = new TextEncoder().encode(key)
  const hash = await crypto.subtle.digest('SHA-256', buffer)
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function getAuthor(req: NextRequest): Promise<Profile | null> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const apiKey = authHeader.slice(7)
  if (!apiKey) return null

  // Hash the key to match stored hash
  const keyHash = await hashKey(apiKey)

  const supabase = getServiceClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('api_key', keyHash)
    .single()

  return data as Profile | null
}

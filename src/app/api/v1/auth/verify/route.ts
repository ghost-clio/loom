export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { getAuthor } from '@/lib/auth'
import { rateLimit } from '@/lib/ratelimit'

// POST /api/v1/auth/verify — verify API key and return profile
export async function POST(req: NextRequest) {
  const rl = rateLimit(req, 'read')
  if (rl) return rl

  const author = await getAuthor(req)
  if (!author) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  return NextResponse.json({
    data: {
      id: author.id,
      name: author.name,
      type: author.type,
      bio: author.bio,
      avatar_url: author.avatar_url,
    }
  })
}

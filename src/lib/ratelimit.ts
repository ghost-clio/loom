import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory rate limiter for edge runtime
// Resets on redeploy (acceptable for CF Pages)
const hits = new Map<string, { count: number; resetAt: number }>()

const LIMITS: Record<string, { max: number; windowMs: number }> = {
  register: { max: 5, windowMs: 3600000 },     // 5 registrations per hour per IP
  post:     { max: 30, windowMs: 60000 },       // 30 posts per minute per IP
  read:     { max: 120, windowMs: 60000 },      // 120 reads per minute per IP
}

function getIP(req: NextRequest): string {
  return req.headers.get('cf-connecting-ip')
    || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown'
}

export function rateLimit(req: NextRequest, action: keyof typeof LIMITS): NextResponse | null {
  const limit = LIMITS[action]
  if (!limit) return null

  const ip = getIP(req)
  const key = `${action}:${ip}`
  const now = Date.now()

  const entry = hits.get(key)
  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + limit.windowMs })
    return null
  }

  entry.count++
  if (entry.count > limit.max) {
    return NextResponse.json(
      { error: `Rate limited — max ${limit.max} ${action} requests per ${limit.windowMs / 1000}s` },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)),
          'X-RateLimit-Limit': String(limit.max),
          'X-RateLimit-Remaining': '0',
        }
      }
    )
  }

  return null
}

// Escape special Postgres LIKE/ILIKE chars
export function sanitizeSearch(q: string): string {
  return q.replace(/[%_\\]/g, '\\$&').slice(0, 200)
}

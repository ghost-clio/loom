// Lightweight PostgREST client — drop-in replacement for @supabase/supabase-js
// Keeps Worker bundle under CF Pages 3 MiB free tier limit

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

function getServiceKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  return key
}

function baseHeaders(key: string) {
  return {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
  }
}

type FilterOp = { col: string; op: string; val: string }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbResult = { data: any; error: any; count?: number | null }

class QueryBuilder {
  private _table: string
  private _key: string
  private _select = '*'
  private _filters: FilterOp[] = []
  private _or = ''
  private _order: string[] = []
  private _limitN?: number
  private _rangeFrom?: number
  private _rangeTo?: number
  private _single = false
  private _count?: 'exact'
  private _head = false
  // for insert/update/upsert
  private _method = 'GET'
  private _body?: unknown
  private _prefer: string[] = []

  constructor(table: string, key: string) {
    this._table = table
    this._key = key
  }

  select(cols: string, opts?: { count?: 'exact'; head?: boolean }) {
    this._select = cols
    if (opts?.count) { this._count = opts.count; this._prefer.push('count=exact') }
    if (opts?.head) this._head = true
    return this
  }

  insert(data: unknown) {
    this._method = 'POST'
    this._body = data
    this._prefer.push('return=representation')
    return this
  }

  update(data: unknown) {
    this._method = 'PATCH'
    this._body = data
    this._prefer.push('return=representation')
    return this
  }

  upsert(data: unknown) {
    this._method = 'POST'
    this._body = data
    this._prefer.push('resolution=merge-duplicates', 'return=representation')
    return this
  }

  eq(col: string, val: string | number) { this._filters.push({ col, op: 'eq', val: String(val) }); return this }
  neq(col: string, val: string | number) { this._filters.push({ col, op: 'neq', val: String(val) }); return this }
  gt(col: string, val: string | number) { this._filters.push({ col, op: 'gt', val: String(val) }); return this }
  gte(col: string, val: string | number) { this._filters.push({ col, op: 'gte', val: String(val) }); return this }
  lt(col: string, val: string | number) { this._filters.push({ col, op: 'lt', val: String(val) }); return this }
  lte(col: string, val: string | number) { this._filters.push({ col, op: 'lte', val: String(val) }); return this }
  contains(col: string, val: unknown[]) { this._filters.push({ col, op: 'cs', val: `{${val.join(',')}}` }); return this }

  or(expr: string) { this._or = expr; return this }

  order(col: string, opts?: { ascending?: boolean }) {
    const dir = opts?.ascending === false ? 'desc' : (opts?.ascending === true ? 'asc' : 'asc')
    // default is asc if not specified
    const actualDir = opts === undefined ? 'asc' : dir
    this._order.push(`${col}.${actualDir}`)
    return this
  }

  limit(n: number) { this._limitN = n; return this }

  range(from: number, to: number) { this._rangeFrom = from; this._rangeTo = to; return this }

  single() { this._single = true; return this }

  async execute(): Promise<DbResult> {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${this._table}`)
    url.searchParams.set('select', this._select)

    for (const f of this._filters) {
      url.searchParams.append(f.col, `${f.op}.${f.val}`)
    }
    if (this._or) url.searchParams.set('or', `(${this._or})`)
    if (this._order.length) url.searchParams.set('order', this._order.join(','))
    if (this._limitN !== undefined) url.searchParams.set('limit', String(this._limitN))

    const h: Record<string, string> = baseHeaders(this._key)
    if (this._prefer.length) h['Prefer'] = this._prefer.join(',')
    if (this._single) h['Accept'] = 'application/vnd.pgrst.object+json'
    if (this._rangeFrom !== undefined && this._rangeTo !== undefined) {
      h['Range'] = `${this._rangeFrom}-${this._rangeTo}`
    }

    const init: RequestInit = {
      method: this._head ? 'HEAD' : this._method,
      headers: h,
    }
    if (this._body && this._method !== 'GET') {
      init.body = JSON.stringify(this._body)
    }

    try {
      const res = await fetch(url.toString(), init)

      // Parse count from content-range header
      let count: number | null = null
      if (this._count) {
        const cr = res.headers.get('content-range')
        if (cr) {
          const match = cr.match(/\/(\d+|\*)/)
          if (match && match[1] !== '*') count = parseInt(match[1])
        }
      }

      if (!res.ok) {
        const body = await res.text()
        let parsed
        try { parsed = JSON.parse(body) } catch { parsed = { message: body } }
        // 406 for .single() with no rows = not found
        if (res.status === 406 || res.status === 404) {
          return { data: null, error: parsed, count }
        }
        return { data: null, error: parsed, count }
      }

      if (this._head) {
        return { data: null, error: null, count }
      }

      const data = await res.json()
      return { data, error: null, count }
    } catch (err) {
      return { data: null, error: { message: String(err) }, count: null }
    }
  }

  // Auto-execute — makes the builder thenable
  then<T>(resolve: (v: DbResult) => T, reject?: (e: unknown) => T): Promise<T> {
    return this.execute().then(resolve, reject) as Promise<T>
  }
}

class RpcBuilder {
  private _fn: string
  private _key: string
  private _args: unknown

  constructor(fn: string, args: unknown, key: string) {
    this._fn = fn
    this._args = args || {}
    this._key = key
  }

  then<T>(resolve: (v: DbResult) => T, reject?: (e: unknown) => T): Promise<T> {
    return this._exec().then(resolve, reject) as Promise<T>
  }

  private async _exec(): Promise<DbResult> {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${this._fn}`, {
        method: 'POST',
        headers: baseHeaders(this._key),
        body: JSON.stringify(this._args),
      })
      if (!res.ok) {
        const body = await res.text()
        return { data: null, error: { message: body } }
      }
      const data = await res.json()
      return { data, error: null }
    } catch (err) {
      return { data: null, error: { message: String(err) } }
    }
  }
}

class SupabaseClient {
  private _key: string

  constructor(key: string) {
    this._key = key
  }

  from(table: string) {
    return new QueryBuilder(table, this._key)
  }

  rpc(fn: string, args?: unknown) {
    return new RpcBuilder(fn, args, this._key)
  }
}

// Public API — drop-in for @supabase/supabase-js
export const supabase = new SupabaseClient(SUPABASE_ANON_KEY)

export function getServiceClient() {
  return new SupabaseClient(getServiceKey())
}

export type { SupabaseClient }

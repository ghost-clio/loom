'use client'

import { useState } from 'react'

export default function LoginPage() {
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!apiKey.trim()) { setError('API key is required'); return }
    setLoading(true)
    setError('')

    try {
      // Verify the key works by trying to create a thread (dry check)
      // Actually just store it and verify on next action
      // Let's verify by fetching threads with auth header to confirm key format
      const res = await fetch('/api/v1/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`,
        },
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Invalid API key'); setLoading(false); return }

      localStorage.setItem('loom_api_key', apiKey.trim())
      localStorage.setItem('loom_user_name', data.data.name)
      localStorage.setItem('loom_user_id', data.data.id)
      window.location.href = '/threads'
    } catch {
      setError('Network error — try again')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 py-8">
      <div className="text-center space-y-2">
        <h1 className="font-mono text-2xl font-bold">sign in</h1>
        <p className="text-zinc-400 text-sm">paste your API key to start posting</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-zinc-500 font-mono mb-1">api key</label>
          <input
            type="text"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="loom_..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:border-emerald-600 focus:outline-none transition"
          />
        </div>

        {error && <p className="text-red-400 text-sm font-mono">{error}</p>}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white font-mono text-sm py-2.5 rounded-lg transition"
        >
          {loading ? 'verifying...' : 'sign in'}
        </button>

        <p className="text-center text-xs text-zinc-600">
          don&apos;t have an account? <a href="/signup" className="text-emerald-500 hover:text-emerald-400">sign up</a>
        </p>
      </div>
    </div>
  )
}

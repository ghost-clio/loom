'use client'

import { useState } from 'react'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState('')
  const [wallet, setWallet] = useState('')
  const [github, setGithub] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ api_key: string; id: string; name: string } | null>(null)
  const [error, setError] = useState('')

  const handleSignup = async () => {
    if (!name.trim()) { setError('Name is required'); return }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          type: 'human',
          bio: bio.trim() || undefined,
          avatar_url: avatar.trim() || undefined,
          wallet_address: wallet.trim() || undefined,
          github_url: github.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Registration failed'); setLoading(false); return }
      setResult(data.data)
      // Save API key to localStorage for future sessions
      localStorage.setItem('loom_api_key', data.data.api_key)
      localStorage.setItem('loom_user_name', data.data.name)
      localStorage.setItem('loom_user_id', data.data.id)
    } catch {
      setError('Network error — try again')
    }
    setLoading(false)
  }

  if (result) {
    return (
      <div className="max-w-lg mx-auto space-y-6 py-8">
        <div className="text-center space-y-2">
          <span className="text-4xl">👤</span>
          <h1 className="font-mono text-2xl font-bold text-emerald-400">you&apos;re in!</h1>
          <p className="text-zinc-400 text-sm">welcome to loom, {result.name}</p>
        </div>

        <div className="p-4 rounded-xl border border-amber-900/50 bg-amber-900/10 space-y-2">
          <p className="text-xs text-amber-400 font-mono font-bold">⚠️ save your API key — it won&apos;t be shown again</p>
          <code className="block text-sm text-emerald-400 font-mono bg-zinc-950 p-3 rounded-lg break-all select-all">
            {result.api_key}
          </code>
          <p className="text-xs text-zinc-500">Your key is saved in this browser. You can also use it with curl.</p>
        </div>

        <div className="flex gap-3 justify-center">
          <a href="/threads" className="text-sm font-mono px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition">
            browse threads →
          </a>
          <a href="/new" className="text-sm font-mono px-4 py-2 rounded-lg border border-zinc-700 hover:border-zinc-600 text-zinc-300 transition">
            post a thread
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 py-8">
      <div className="text-center space-y-2">
        <h1 className="font-mono text-2xl font-bold">join loom</h1>
        <p className="text-zinc-400 text-sm">sign up to post threads, reply, and share projects</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-zinc-500 font-mono mb-1">name *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="your name or handle"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:border-emerald-600 focus:outline-none transition"
          />
        </div>

        <div>
          <label className="block text-xs text-zinc-500 font-mono mb-1">avatar url <span className="text-zinc-700">(optional — link to your pfp)</span></label>
          <input
            type="text"
            value={avatar}
            onChange={e => setAvatar(e.target.value)}
            placeholder="https://example.com/avatar.png"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:border-emerald-600 focus:outline-none transition"
          />
        </div>

        <div>
          <label className="block text-xs text-zinc-500 font-mono mb-1">bio</label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="what do you build?"
            rows={2}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:border-emerald-600 focus:outline-none transition resize-none"
          />
        </div>

        <div>
          <label className="block text-xs text-zinc-500 font-mono mb-1">github url <span className="text-zinc-700">(optional)</span></label>
          <input
            type="text"
            value={github}
            onChange={e => setGithub(e.target.value)}
            placeholder="https://github.com/you"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:border-emerald-600 focus:outline-none transition"
          />
        </div>

        <div>
          <label className="block text-xs text-zinc-500 font-mono mb-1">wallet address <span className="text-zinc-700">(optional — for marketplace)</span></label>
          <input
            type="text"
            value={wallet}
            onChange={e => setWallet(e.target.value)}
            placeholder="0x... or So1..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:border-emerald-600 focus:outline-none transition"
          />
        </div>

        {error && <p className="text-red-400 text-sm font-mono">{error}</p>}

        <button
          onClick={handleSignup}
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white font-mono text-sm py-2.5 rounded-lg transition"
        >
          {loading ? 'creating...' : 'sign up'}
        </button>

        <p className="text-center text-xs text-zinc-600">
          already have a key? <a href="/login" className="text-emerald-500 hover:text-emerald-400">sign in</a>
        </p>
      </div>
    </div>
  )
}

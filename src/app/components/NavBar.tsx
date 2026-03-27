'use client'

import { useEffect, useState } from 'react'

export default function NavBar() {
  const [user, setUser] = useState<{ name: string } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const name = localStorage.getItem('loom_user_name')
    const key = localStorage.getItem('loom_api_key')
    if (name && key) setUser({ name })
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('loom_api_key')
    localStorage.removeItem('loom_user_name')
    localStorage.removeItem('loom_user_id')
    setUser(null)
    window.location.href = '/'
  }

  return (
    <nav className="border-b border-zinc-800 px-6 py-3 flex items-center justify-between">
      <a href="/" className="font-mono text-lg font-bold tracking-tight text-white hover:text-emerald-400 transition">
        ◈ loom
      </a>
      <div className="flex items-center gap-6 text-sm text-zinc-400 font-mono">
        <a href="/threads" className="hover:text-white transition">threads</a>
        <a href="/marketplace" className="hover:text-white transition">marketplace</a>
        <a href="/projects" className="hover:text-white transition">projects</a>
        <a href="/boards" className="hover:text-white transition">boards</a>
        <a href="/docs" className="hover:text-white transition">api</a>
        {mounted && (
          user ? (
            <>
              <a href="/new" className="text-emerald-400 hover:text-emerald-300 transition">+ new</a>
              <span className="text-zinc-500">
                👤 {user.name}
                <button onClick={handleLogout} className="ml-2 text-zinc-600 hover:text-zinc-400 transition text-xs">(logout)</button>
              </span>
            </>
          ) : (
            <a href="/signup" className="text-emerald-400 hover:text-emerald-300 transition">sign up</a>
          )
        )}
      </div>
    </nav>
  )
}

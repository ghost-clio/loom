'use client'

import { useEffect, useState } from 'react'

export default function NavBar() {
  const [user, setUser] = useState<{ name: string; id: string } | null>(null)
  const [mounted, setMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    const name = localStorage.getItem('loom_user_name')
    const key = localStorage.getItem('loom_api_key')
    const id = localStorage.getItem('loom_user_id')
    if (name && key && id) setUser({ name, id })
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('loom_api_key')
    localStorage.removeItem('loom_user_name')
    localStorage.removeItem('loom_user_id')
    setUser(null)
    window.location.href = '/'
  }

  const links = [
    { href: '/threads', label: 'threads' },
    { href: '/upcoming', label: 'upcoming' },
    { href: '/marketplace', label: 'marketplace' },
    { href: '/projects', label: 'projects' },
    { href: '/boards', label: 'boards' },
    { href: '/docs', label: 'api' },
  ]

  return (
    <nav className="border-b border-zinc-800 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between">
        <a href="/" className="font-mono text-lg font-bold tracking-tight text-white hover:text-emerald-400 transition">
          ◈ loom
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6 text-sm text-zinc-400 font-mono">
          {links.map(l => (
            <a key={l.href} href={l.href} className="hover:text-white transition">{l.label}</a>
          ))}
          {mounted && (
            user ? (
              <>
                <a href="/new" className="text-emerald-400 hover:text-emerald-300 transition">+ new</a>
                <a href={`/profile/${user.id}`} className="text-zinc-500 hover:text-emerald-400 transition">👤 {user.name}</a>
                <button onClick={handleLogout} className="text-zinc-600 hover:text-zinc-400 transition text-xs">(logout)</button>
              </>
            ) : (
              <a href="/signup" className="text-emerald-400 hover:text-emerald-300 transition">sign up</a>
            )
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-zinc-400 hover:text-white transition font-mono text-lg"
        >
          {menuOpen ? '✕' : '≡'}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden mt-3 pb-2 flex flex-col gap-3 text-sm text-zinc-400 font-mono border-t border-zinc-800 pt-3">
          {links.map(l => (
            <a key={l.href} href={l.href} className="hover:text-white transition">{l.label}</a>
          ))}
          {mounted && (
            user ? (
              <>
                <a href="/new" className="text-emerald-400 hover:text-emerald-300 transition">+ new thread</a>
                <a href={`/profile/${user.id}`} className="text-zinc-500 hover:text-emerald-400 transition">👤 {user.name}</a>
                <button onClick={handleLogout} className="text-left text-zinc-600 hover:text-zinc-400 transition text-xs">(logout)</button>
              </>
            ) : (
              <a href="/signup" className="text-emerald-400 hover:text-emerald-300 transition">sign up</a>
            )
          )}
        </div>
      )}
    </nav>
  )
}

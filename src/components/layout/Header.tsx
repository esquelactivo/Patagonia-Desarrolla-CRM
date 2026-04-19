'use client'

import React, { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'

interface HeaderProps {
  onMenuClick?: () => void
}

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/propiedades': 'Propiedades',
  '/contactos': 'Contactos',
  '/consultas': 'Consultas',
  '/pipeline': 'Pipeline',
  '/campanias': 'Campañas',
  '/calendario': 'Calendario',
}

interface NotifInquiry {
  id: string
  name: string
  adName?: string | null
  source?: string | null
  createdAt: string
}

const SEEN_KEY = 'notif_seen_ids'

const getSeenIds = (): string[] => {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]') } catch { return [] }
}
const markSeen = (ids: string[]) => {
  try { localStorage.setItem(SEEN_KEY, JSON.stringify(ids)) } catch {}
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const title = pageTitles[pathname] || 'InmoCRM'

  const [open, setOpen] = useState(false)
  const [inquiries, setInquiries] = useState<NotifInquiry[]>([])
  const [seenIds, setSeenIds] = useState<string[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSeenIds(getSeenIds())
    fetchNew()
    const interval = setInterval(fetchNew, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const fetchNew = async () => {
    try {
      const res = await fetch('/api/inquiries')
      if (!res.ok) return
      const data: NotifInquiry[] = await res.json()
      setInquiries(data.filter(i => (i as { status?: string }).status === 'NUEVA').slice(0, 10))
    } catch {}
  }

  const unseen = inquiries.filter(i => !seenIds.includes(i.id))

  const handleOpen = () => {
    setOpen(o => !o)
    if (!open) {
      const allIds = inquiries.map(i => i.id)
      markSeen(allIds)
      setSeenIds(allIds)
    }
  }

  const handleGoToConsultas = () => {
    setOpen(false)
    router.push('/consultas')
  }

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 60) return `hace ${m}m`
    const h = Math.floor(m / 60)
    if (h < 24) return `hace ${h}h`
    return `hace ${Math.floor(h / 24)}d`
  }

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Search bar */}
        <div className="relative hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar..."
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
          />
        </div>

        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleOpen}
            className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unseen.length > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold px-0.5">
                {unseen.length > 9 ? '9+' : unseen.length}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">Consultas nuevas</span>
                <button onClick={handleGoToConsultas} className="text-xs text-blue-600 hover:underline">Ver todas</button>
              </div>
              {inquiries.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-400">Sin consultas nuevas</div>
              ) : (
                <ul className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                  {inquiries.map(i => (
                    <li
                      key={i.id}
                      onClick={handleGoToConsultas}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-900">{i.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {i.adName || i.source || 'Sin origen'} · {formatTime(i.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* User avatar */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            A
          </div>
          <span className="text-sm font-medium text-gray-700 hidden md:block">Admin</span>
        </div>
      </div>
    </header>
  )
}

export default Header

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'

interface InquiryNotif {
  kind: 'inquiry'
  id: string
  name: string
  adName?: string | null
  source?: string | null
  status: string
  createdAt: string
}

interface ReminderNotif {
  kind: 'reminder'
  id: string
  title: string
  type: string
  date: string
  done: boolean
  contact?: { id: string; name: string } | null
  inquiry?: { id: string; name: string } | null
}

interface SharedActivityNotif {
  kind: 'shared'
  id: string
  title: string
  type: string
  date: string
  done: boolean
  user?: { id: string; name: string } | null
  contact?: { id: string; name: string } | null
  inquiry?: { id: string; name: string } | null
}

type NotifItem = InquiryNotif | ReminderNotif | SharedActivityNotif

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'ahora'
  if (m < 60) return `hace ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `hace ${d}d`
  return new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDatetime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

const inquiryStatusVariant: Record<string, 'default' | 'info' | 'success' | 'warning' | 'danger'> = {
  NUEVA: 'info',
  CONTACTADA: 'warning',
  CALIFICADA: 'success',
  DESCARTADA: 'danger',
}

export default function NotificacionesPage() {
  const router = useRouter()
  const [inquiries, setInquiries] = useState<InquiryNotif[]>([])
  const [reminders, setReminders] = useState<ReminderNotif[]>([])
  const [sharedActivities, setSharedActivities] = useState<SharedActivityNotif[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'inquiries' | 'reminders' | 'shared'>('all')

  useEffect(() => {
    fetchAll()
    // Mark shared activity notifications as seen
    fetch('/api/activities/mark-seen', { method: 'POST' }).catch(() => {})
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    await Promise.all([fetchInquiries(), fetchReminders(), fetchSharedActivities()])
    setLoading(false)
  }

  const fetchInquiries = async () => {
    try {
      const res = await fetch('/api/inquiries')
      if (res.ok) {
        const data = await res.json()
        setInquiries(
          data.map((i: { id: string; name: string; adName?: string | null; source?: string | null; status: string; createdAt: string }) => ({
            kind: 'inquiry' as const,
            ...i,
          }))
        )
      }
    } catch { /* ignore */ }
  }

  const fetchReminders = async () => {
    try {
      const res = await fetch('/api/activities')
      if (res.ok) {
        const data = await res.json()
        // Only show activities where I'm the creator (own reminders)
        setReminders(
          data
            .filter((a: { participants?: unknown[] }) => !a.participants)
            .map((a: { id: string; title: string; type: string; date: string; done: boolean; contact?: { id: string; name: string } | null; inquiry?: { id: string; name: string } | null }) => ({
              kind: 'reminder' as const,
              id: a.id,
              title: a.title,
              type: a.type,
              date: a.date,
              done: a.done,
              contact: a.contact,
              inquiry: a.inquiry,
            }))
        )
      }
    } catch { /* ignore */ }
  }

  const fetchSharedActivities = async () => {
    try {
      const res = await fetch('/api/activities?participating=true')
      if (res.ok) {
        const data = await res.json()
        setSharedActivities(
          data.map((a: { id: string; title: string; type: string; date: string; done: boolean; user?: { id: string; name: string } | null; contact?: { id: string; name: string } | null; inquiry?: { id: string; name: string } | null }) => ({
            kind: 'shared' as const,
            id: a.id,
            title: a.title,
            type: a.type,
            date: a.date,
            done: a.done,
            user: a.user,
            contact: a.contact,
            inquiry: a.inquiry,
          }))
        )
      }
    } catch { /* ignore */ }
  }

  const allItems: NotifItem[] = [
    ...(filter !== 'reminders' && filter !== 'shared' ? inquiries : []),
    ...(filter !== 'inquiries' && filter !== 'shared' ? reminders : []),
    ...(filter !== 'inquiries' && filter !== 'reminders' ? sharedActivities : []),
  ].sort((a, b) => {
    const dateA = a.kind === 'inquiry' ? a.createdAt : a.date
    const dateB = b.kind === 'inquiry' ? b.createdAt : b.date
    return new Date(dateB).getTime() - new Date(dateA).getTime()
  })

  const dueReminders = reminders.filter((r) => !r.done && new Date(r.date) <= new Date())
  const newInquiries = inquiries.filter((i) => i.status === 'NUEVA')
  const pendingShared = sharedActivities.filter((a) => !a.done)

  const filterTabs: { key: typeof filter; label: string }[] = [
    { key: 'all', label: 'Todo' },
    { key: 'inquiries', label: 'Consultas' },
    { key: 'reminders', label: 'Recordatorios' },
    { key: 'shared', label: `Actividades${pendingShared.length > 0 ? ` (${pendingShared.length})` : ''}` },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Notificaciones</h2>
          <p className="text-sm text-gray-500">
            {newInquiries.length} consultas nuevas · {dueReminders.length} recordatorios vencidos
            {pendingShared.length > 0 && ` · ${pendingShared.length} actividades compartidas`}
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div
          onClick={() => { setFilter('inquiries'); router.push('/consultas') }}
          className="bg-blue-50 border border-blue-100 rounded-xl p-4 cursor-pointer hover:bg-blue-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{newInquiries.length}</p>
              <p className="text-xs text-blue-600 font-medium">Consultas nuevas</p>
            </div>
          </div>
        </div>
        <div
          onClick={() => router.push('/agenda')}
          className="bg-purple-50 border border-purple-100 rounded-xl p-4 cursor-pointer hover:bg-purple-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-700">{dueReminders.length}</p>
              <p className="text-xs text-purple-600 font-medium">Recordatorios vencidos</p>
            </div>
          </div>
        </div>
        {pendingShared.length > 0 && (
          <div
            onClick={() => setFilter('shared')}
            className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 cursor-pointer hover:bg-indigo-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-indigo-700">{pendingShared.length}</p>
                <p className="text-xs text-indigo-600 font-medium">Actividades compartidas</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {filterTabs.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
              filter === f.key ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : allItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          Sin notificaciones
        </div>
      ) : (
        <div className="space-y-2">
          {allItems.map((item) => {
            if (item.kind === 'inquiry') {
              return (
                <div key={`inquiry-${item.id}`} onClick={() => router.push('/consultas')}
                  className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-gray-900 truncate">{item.name}</p>
                        <span className="text-xs text-gray-400 flex-shrink-0">{formatRelative(item.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={inquiryStatusVariant[item.status] || 'default'} className="text-xs">{item.status}</Badge>
                        {(item.adName || item.source) && (
                          <span className="text-xs text-gray-500 truncate">{item.adName || item.source}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDatetime(item.createdAt)}</p>
                    </div>
                  </div>
                </div>
              )
            }

            if (item.kind === 'shared') {
              const isPast = new Date(item.date) < new Date()
              return (
                <div key={`shared-${item.id}`} onClick={() => router.push('/agenda')}
                  className={`bg-white rounded-xl border p-4 shadow-sm cursor-pointer transition-colors border-indigo-100 hover:bg-indigo-50 ${item.done ? 'opacity-60' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`font-medium text-gray-900 truncate ${item.done ? 'line-through text-gray-400' : ''}`}>{item.title}</p>
                        <span className="text-xs text-gray-400 flex-shrink-0">{formatRelative(item.date)}</span>
                      </div>
                      {item.user && (
                        <p className="text-xs text-indigo-600 font-medium mt-0.5">Invitado por {item.user.name}</p>
                      )}
                      <p className={`text-xs mt-0.5 font-medium ${!item.done && isPast ? 'text-red-500' : 'text-gray-500'}`}>
                        {formatDatetime(item.date)}{!item.done && isPast ? ' — Vencido' : ''}
                      </p>
                      {(item.contact || item.inquiry) && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.contact && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{item.contact.name}</span>}
                          {item.inquiry && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{item.inquiry.name}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            }

            const isPast = new Date(item.date) < new Date()
            return (
              <div key={`reminder-${item.id}`} onClick={() => router.push('/agenda')}
                className={`bg-white rounded-xl border p-4 shadow-sm cursor-pointer transition-colors ${
                  !item.done && isPast ? 'border-red-200 bg-red-50 hover:bg-red-100' : 'border-gray-200 hover:bg-gray-50'
                } ${item.done ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${item.done ? 'bg-green-100' : isPast ? 'bg-red-100' : 'bg-purple-100'}`}>
                    {item.done ? (
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className={`w-4 h-4 ${isPast ? 'text-red-600' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`font-medium text-gray-900 truncate ${item.done ? 'line-through text-gray-400' : ''}`}>{item.title}</p>
                      <span className="text-xs text-gray-400 flex-shrink-0">{formatRelative(item.date)}</span>
                    </div>
                    <p className={`text-xs mt-0.5 font-medium ${!item.done && isPast ? 'text-red-500' : 'text-gray-500'}`}>
                      {formatDatetime(item.date)}{!item.done && isPast ? ' — Vencido' : ''}
                    </p>
                    {(item.contact || item.inquiry) && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.contact && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{item.contact.name}</span>}
                        {item.inquiry && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{item.inquiry.name}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'

interface Participant {
  userId: string
  user: { id: string; name: string }
}

interface ActivityItem {
  id: string
  title: string
  type: string
  date: string
  done: boolean
  notes?: string | null
  contactId?: string | null
  inquiryId?: string | null
  contact?: { id: string; name: string } | null
  inquiry?: { id: string; name: string; adName?: string | null } | null
  user?: { id: string; name: string } | null
  participants?: Participant[]
}

interface UserOption {
  id: string
  name: string
}

interface ContactOption {
  id: string
  name: string
}

interface InquiryOption {
  id: string
  name: string
  adName?: string | null
}

const typeOptions = [
  { value: 'RECORDATORIO', label: 'Recordatorio' },
  { value: 'LLAMADA', label: 'Llamada' },
  { value: 'REUNION', label: 'Reunión' },
  { value: 'VISITA', label: 'Visita' },
  { value: 'SEGUIMIENTO', label: 'Seguimiento' },
]

const typeColors: Record<string, string> = {
  RECORDATORIO: 'bg-purple-100 text-purple-700',
  LLAMADA: 'bg-blue-100 text-blue-700',
  REUNION: 'bg-indigo-100 text-indigo-700',
  VISITA: 'bg-green-100 text-green-700',
  SEGUIMIENTO: 'bg-yellow-100 text-yellow-700',
}

const typeLabels: Record<string, string> = {
  RECORDATORIO: 'Recordatorio',
  LLAMADA: 'Llamada',
  REUNION: 'Reunión',
  VISITA: 'Visita',
  SEGUIMIENTO: 'Seguimiento',
}

const emptyForm = {
  title: '',
  type: 'RECORDATORIO',
  date: '',
  notes: '',
  contactId: '',
  inquiryId: '',
}

function toLocalDatetimeInput(dateStr: string): string {
  const d = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function getDefaultDatetime(): string {
  const d = new Date()
  d.setHours(d.getHours() + 1, 0, 0, 0)
  return toLocalDatetimeInput(d.toISOString())
}

// Participant multi-select component
function ParticipantSelector({
  agents,
  selectedIds,
  currentUserId,
  onChange,
}: {
  agents: UserOption[]
  selectedIds: string[]
  currentUserId: string | null
  onChange: (ids: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const available = agents.filter((a) => a.id !== currentUserId)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id])
  }

  const selectedNames = selectedIds.map((id) => agents.find((a) => a.id === id)?.name).filter(Boolean)

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Notificar a agentes <span className="text-gray-400 font-normal">(opcional)</span>
      </label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      >
        <span className={selectedIds.length === 0 ? 'text-gray-400' : 'text-gray-800'}>
          {selectedIds.length === 0
            ? 'Seleccionar agentes...'
            : `${selectedIds.length} agente${selectedIds.length > 1 ? 's' : ''} seleccionado${selectedIds.length > 1 ? 's' : ''}`}
        </span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {available.length === 0 ? (
            <p className="px-3 py-3 text-sm text-gray-400">No hay otros agentes disponibles</p>
          ) : (
            <ul className="max-h-40 overflow-y-auto divide-y divide-gray-50">
              {available.map((agent) => (
                <li key={agent.id}>
                  <label className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(agent.id)}
                      onChange={() => toggle(agent.id)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{agent.name}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selectedNames.map((name, i) => (
            <span
              key={selectedIds[i]}
              className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full"
            >
              {name}
              <button
                type="button"
                onClick={() => toggle(selectedIds[i])}
                className="hover:text-blue-900 ml-0.5 leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AgendaPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [contacts, setContacts] = useState<ContactOption[]>([])
  const [inquiries, setInquiries] = useState<InquiryOption[]>([])
  const [agents, setAgents] = useState<UserOption[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'done' | 'all'>('pending')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<ActivityItem | null>(null)
  const [form, setForm] = useState({ ...emptyForm, date: getDefaultDatetime() })
  const [participantIds, setParticipantIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    fetchAll()
    // Mark participant notifications as seen when visiting agenda
    fetch('/api/activities/mark-seen', { method: 'POST' }).catch(() => {})
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    await Promise.all([fetchActivities(), fetchContacts(), fetchInquiries(), fetchAgents(), fetchCurrentUser()])
    setLoading(false)
  }

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/activities')
      if (res.ok) setActivities(await res.json())
    } catch { /* ignore */ }
  }

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/contacts')
      if (res.ok) setContacts(await res.json())
    } catch { /* ignore */ }
  }

  const fetchInquiries = async () => {
    try {
      const res = await fetch('/api/inquiries')
      if (res.ok) {
        const data: InquiryOption[] = await res.json()
        setInquiries(data.slice(0, 100))
      }
    } catch { /* ignore */ }
  }

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/users')
      if (res.ok) setAgents(await res.json())
    } catch { /* ignore */ }
  }

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const me = await res.json()
        setCurrentUserId(me.id)
      }
    } catch { /* ignore */ }
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const filtered = activities.filter((a) => {
    if (filter === 'pending') return !a.done
    if (filter === 'done') return a.done
    return true
  })

  const sorted = [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const openCreate = () => {
    setEditItem(null)
    setForm({ ...emptyForm, date: getDefaultDatetime() })
    setParticipantIds([])
    setModalOpen(true)
  }

  const openEdit = (item: ActivityItem) => {
    setEditItem(item)
    setForm({
      title: item.title,
      type: item.type,
      date: toLocalDatetimeInput(item.date),
      notes: item.notes || '',
      contactId: item.contactId || '',
      inquiryId: item.inquiryId || '',
    })
    setParticipantIds(item.participants?.map((p) => p.userId) || [])
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const payload = {
        title: form.title,
        type: form.type,
        date: form.date ? new Date(form.date).toISOString() : new Date().toISOString(),
        notes: form.notes || null,
        contactId: form.contactId || null,
        inquiryId: form.inquiryId || null,
        participantIds,
      }
      if (editItem) {
        const res = await fetch(`/api/activities?id=${editItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const updated = await res.json()
          setActivities(activities.map((a) => (a.id === editItem.id ? updated : a)))
          showToast('Recordatorio actualizado')
        }
      } else {
        const res = await fetch('/api/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const created = await res.json()
          setActivities([created, ...activities])
          showToast('Recordatorio creado')
        }
      }
      setModalOpen(false)
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }

  const toggleDone = async (item: ActivityItem) => {
    try {
      const res = await fetch(`/api/activities?id=${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: !item.done }),
      })
      if (res.ok) {
        const updated = await res.json()
        setActivities(activities.map((a) => (a.id === item.id ? updated : a)))
      }
    } catch { /* ignore */ }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/activities?id=${id}`, { method: 'DELETE' })
      setActivities(activities.filter((a) => a.id !== id))
      showToast('Recordatorio eliminado')
    } catch { /* ignore */ }
    setDeleteId(null)
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    const isToday = d.toDateString() === today.toDateString()
    const isTomorrow = d.toDateString() === tomorrow.toDateString()
    const isPast = d < today

    const timeStr = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    if (isToday) return { label: `Hoy ${timeStr}`, past: false, today: true }
    if (isTomorrow) return { label: `Mañana ${timeStr}`, past: false, today: false }

    const dateLabel = d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    return { label: `${dateLabel} ${timeStr}`, past: isPast && !isToday, today: false }
  }

  const pendingCount = activities.filter((a) => !a.done).length
  const isInvited = (item: ActivityItem) => item.user && item.user.id !== currentUserId

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white bg-green-500">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Agenda</h2>
          <p className="text-sm text-gray-500">{pendingCount} pendientes</p>
        </div>
        <Button onClick={openCreate}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo recordatorio
        </Button>
      </div>

      <div className="flex gap-2">
        {(['pending', 'all', 'done'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f === 'pending' ? 'Pendientes' : f === 'done' ? 'Realizados' : 'Todos'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : sorted.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          <svg className="w-10 h-10 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          No hay recordatorios
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((item) => {
            const { label, past, today } = formatDate(item.date)
            const invited = isInvited(item)
            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl border p-4 shadow-sm transition-colors ${
                  item.done ? 'border-gray-100 opacity-60' : past ? 'border-red-200 bg-red-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleDone(item)}
                    className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      item.done ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {item.done && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`font-medium text-gray-900 ${item.done ? 'line-through text-gray-400' : ''}`}>
                        {item.title}
                      </p>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!invited && (
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        {!invited && (
                          <button
                            onClick={() => setDeleteId(item.id)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[item.type] || 'bg-gray-100 text-gray-600'}`}>
                        {typeLabels[item.type] || item.type}
                      </span>
                      <span className={`text-xs font-medium ${past && !item.done ? 'text-red-500' : today ? 'text-blue-600' : 'text-gray-500'}`}>
                        {label}
                        {past && !item.done && ' — Vencido'}
                      </span>
                      {invited && (
                        <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">
                          Invitado por {item.user?.name}
                        </span>
                      )}
                    </div>

                    {(item.contact || item.inquiry) && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {item.contact && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {item.contact.name}
                          </span>
                        )}
                        {item.inquiry && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                            {item.inquiry.name}
                          </span>
                        )}
                      </div>
                    )}

                    {item.participants && item.participants.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="text-xs text-gray-400 self-center">Con:</span>
                        {item.participants.map((p) => (
                          <span key={p.userId} className="inline-flex items-center text-xs text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                            {p.user.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {item.notes && (
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">{item.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? 'Editar recordatorio' : 'Nuevo recordatorio'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Título"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Llamar a cliente..."
          />
          <Select
            label="Tipo"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            options={typeOptions}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y hora</label>
            <input
              type="datetime-local"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Select
            label="Vincular a contacto (opcional)"
            value={form.contactId}
            onChange={(e) => setForm({ ...form, contactId: e.target.value })}
            options={[
              { value: '', label: 'Sin contacto' },
              ...contacts.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
          <Select
            label="Vincular a consulta (opcional)"
            value={form.inquiryId}
            onChange={(e) => setForm({ ...form, inquiryId: e.target.value })}
            options={[
              { value: '', label: 'Sin consulta' },
              ...inquiries.map((i) => ({ value: i.id, label: `${i.name}${i.adName ? ` · ${i.adName}` : ''}` })),
            ]}
          />
          <ParticipantSelector
            agents={agents}
            selectedIds={participantIds}
            currentUserId={currentUserId}
            onChange={setParticipantIds}
          />
          <Textarea
            label="Notas (opcional)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Notas sobre este recordatorio..."
            rows={3}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}>
              {editItem ? 'Guardar cambios' : 'Crear recordatorio'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Eliminar recordatorio" size="sm">
        <p className="text-sm text-gray-600 mb-6">¿Estás seguro de que querés eliminar este recordatorio?</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button variant="danger" onClick={() => deleteId && handleDelete(deleteId)}>Eliminar</Button>
        </div>
      </Modal>
    </div>
  )
}

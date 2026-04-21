'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import type { Activity } from '@/types'

interface UserOption { id: string; name: string }

function ParticipantSelector({
  agents, selectedIds, currentUserId, onChange,
}: {
  agents: UserOption[]; selectedIds: string[]; currentUserId: string | null; onChange: (ids: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const available = agents.filter((a) => a.id !== currentUserId)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggle = (id: string) =>
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id])

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Notificar a agentes <span className="text-gray-400 font-normal">(opcional)</span>
      </label>
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
        <span className={selectedIds.length === 0 ? 'text-gray-400' : 'text-gray-800'}>
          {selectedIds.length === 0 ? 'Seleccionar agentes...' : `${selectedIds.length} seleccionado${selectedIds.length > 1 ? 's' : ''}`}
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
                    <input type="checkbox" checked={selectedIds.includes(agent.id)} onChange={() => toggle(agent.id)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
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
          {selectedIds.map((id) => {
            const name = agents.find((a) => a.id === id)?.name
            return name ? (
              <span key={id} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">
                {name}
                <button type="button" onClick={() => toggle(id)} className="hover:text-blue-900 ml-0.5">×</button>
              </span>
            ) : null
          })}
        </div>
      )}
    </div>
  )
}

const today = new Date()
const thisYear = today.getFullYear()
const thisMonth = today.getMonth()

const mockActivities: Activity[] = [
  {
    id: '1',
    title: 'Visita Casa Palermo',
    type: 'VISITA',
    date: new Date(thisYear, thisMonth, 15, 10, 0).toISOString(),
    done: false,
    notes: 'Llevar carpeta de propiedades',
    contactId: '1',
    propertyId: '1',
    dealId: null,
    userId: 'demo',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Llamada María García',
    type: 'LLAMADA',
    date: new Date(thisYear, thisMonth, 17, 14, 30).toISOString(),
    done: false,
    notes: 'Seguimiento oferta',
    contactId: '1',
    propertyId: null,
    dealId: null,
    userId: 'demo',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Reunión con propietario',
    type: 'REUNION',
    date: new Date(thisYear, thisMonth, 20, 11, 0).toISOString(),
    done: true,
    notes: 'Discutir precio de venta',
    contactId: '2',
    propertyId: null,
    dealId: null,
    userId: 'demo',
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Seguimiento Carlos',
    type: 'SEGUIMIENTO',
    date: new Date(thisYear, thisMonth, 22, 9, 0).toISOString(),
    done: false,
    notes: null,
    contactId: '2',
    propertyId: null,
    dealId: null,
    userId: 'demo',
    createdAt: new Date().toISOString(),
  },
  {
    id: '5',
    title: 'Visita Depto Belgrano',
    type: 'VISITA',
    date: new Date(thisYear, thisMonth, today.getDate(), 16, 0).toISOString(),
    done: false,
    notes: 'Segunda visita',
    contactId: '3',
    propertyId: '2',
    dealId: null,
    userId: 'demo',
    createdAt: new Date().toISOString(),
  },
]

const typeColors: Record<string, string> = {
  VISITA: 'bg-blue-500',
  LLAMADA: 'bg-green-500',
  REUNION: 'bg-purple-500',
  SEGUIMIENTO: 'bg-orange-500',
}

const typeBadge: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  VISITA: 'info',
  LLAMADA: 'success',
  REUNION: 'default',
  SEGUIMIENTO: 'warning',
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const emptyForm = {
  title: '',
  type: 'LLAMADA',
  date: '',
  time: '',
  notes: '',
}

export default function CalendarioPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [agents, setAgents] = useState<UserOption[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date(thisYear, thisMonth, 1))
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate())
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [participantIds, setParticipantIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchActivities()
    fetch('/api/users').then(r => r.ok ? r.json() : []).then(setAgents).catch(() => {})
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(me => { if (me) setCurrentUserId(me.id) }).catch(() => {})
  }, [])

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/activities')
      if (res.ok) {
        const data = await res.json()
        setActivities(data)
      } else {
        setActivities(mockActivities)
      }
    } catch {
      setActivities(mockActivities)
    } finally {
      setLoading(false)
    }
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const getActivitiesForDay = (day: number) => {
    return activities.filter((a) => {
      const d = new Date(a.date)
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
    })
  }

  const selectedActivities = selectedDay ? getActivitiesForDay(selectedDay) : []

  const toggleDone = async (id: string, done: boolean) => {
    try {
      await fetch(`/api/activities?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done }),
      })
    } catch { /* ignore */ }
    setActivities(activities.map((a) => (a.id === id ? { ...a, done } : a)))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const dateTime = form.date && form.time
        ? new Date(`${form.date}T${form.time}:00`).toISOString()
        : form.date
          ? new Date(form.date).toISOString()
          : new Date().toISOString()

      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, type: form.type, date: dateTime, notes: form.notes, participantIds }),
      })
      if (res.ok) {
        const created = await res.json()
        setActivities([...activities, created])
      }

      setModalOpen(false)
      setForm(emptyForm)
      setParticipantIds([])
    } finally {
      setSaving(false)
    }
  }

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }

  const isToday = (day: number) => {
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Calendario</h2>
          <p className="text-sm text-gray-500">{activities.length} actividades programadas</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Actividad
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Month navigation */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h3 className="text-base font-semibold text-gray-900">
                {MONTHS[month]} {year}
              </h3>
              <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-gray-100">
              {DAYS.map((d) => (
                <div key={d} className="text-center py-2 text-xs font-semibold text-gray-500">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-20 border-b border-r border-gray-50 bg-gray-50/50" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dayActivities = getActivitiesForDay(day)
                const isSelected = selectedDay === day
                const isTodayDay = isToday(day)

                return (
                  <div
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`h-20 border-b border-r border-gray-100 p-1 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                    } ${(firstDay + i + 1) % 7 === 0 ? 'border-r-0' : ''}`}
                  >
                    <div className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                      isTodayDay ? 'bg-blue-600 text-white' : isSelected ? 'text-blue-600' : 'text-gray-700'
                    }`}>
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {dayActivities.slice(0, 2).map((act) => (
                        <div
                          key={act.id}
                          className={`w-full h-1.5 rounded-full ${typeColors[act.type] || 'bg-gray-400'} ${act.done ? 'opacity-40' : ''}`}
                          title={act.title}
                        />
                      ))}
                      {dayActivities.length > 2 && (
                        <span className="text-xs text-gray-400">+{dayActivities.length - 2}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="px-6 py-3 border-t border-gray-100 flex gap-4 flex-wrap">
              {Object.entries(typeColors).map(([type, color]) => (
                <div key={type} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                  <span className="text-xs text-gray-500">{type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Day Activities */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">
                {selectedDay ? `${selectedDay} de ${MONTHS[month]}` : 'Seleccionar día'}
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {loading ? (
                <p className="text-sm text-gray-400 text-center py-4">Cargando...</p>
              ) : selectedActivities.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Sin actividades este día</p>
              ) : (
                selectedActivities.map((act) => (
                  <div key={act.id} className={`border rounded-lg p-3 ${act.done ? 'opacity-60 bg-gray-50' : 'bg-white'}`}>
                    <div className="flex items-start gap-2">
                      <button
                        onClick={() => toggleDone(act.id, !act.done)}
                        className={`mt-0.5 w-4 h-4 rounded border-2 flex-shrink-0 transition-colors ${
                          act.done ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-400'
                        }`}
                      >
                        {act.done && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${act.done ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                          {act.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={typeBadge[act.type] || 'default'}>{act.type}</Badge>
                          <span className="text-xs text-gray-400">{formatTime(act.date)}</span>
                        </div>
                        {act.notes && <p className="text-xs text-gray-400 mt-1">{act.notes}</p>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Activity Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nueva Actividad"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Título"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Visita propiedad en Palermo"
          />
          <Select
            label="Tipo"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            options={[
              { value: 'VISITA', label: 'Visita' },
              { value: 'LLAMADA', label: 'Llamada' },
              { value: 'REUNION', label: 'Reunión' },
              { value: 'SEGUIMIENTO', label: 'Seguimiento' },
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
            <Input
              label="Hora"
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
            />
          </div>
          <Textarea
            label="Notas"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Notas adicionales..."
            rows={3}
          />
          <ParticipantSelector
            agents={agents}
            selectedIds={participantIds}
            currentUserId={currentUserId}
            onChange={setParticipantIds}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}>Crear actividad</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

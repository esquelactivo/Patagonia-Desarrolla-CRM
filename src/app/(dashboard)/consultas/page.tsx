'use client'

import React, { useState, useEffect, useRef } from 'react'
import Papa from 'papaparse'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import type { Inquiry } from '@/types'

interface Agent {
  id: string
  name: string
  email: string
  role: string
}

const mockInquiries: Inquiry[] = [
  {
    id: '1',
    name: 'Pedro Sánchez',
    email: 'pedro@email.com',
    phone: '+54 11 1234-5678',
    message: 'Me interesa la casa en Palermo, ¿puedo visitar?',
    source: 'Web',
    propertyId: null,
    contactId: null,
    status: 'NUEVA',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Laura Fernández',
    email: 'laura.f@email.com',
    phone: '+54 9 11 9876-5432',
    message: 'Busco departamento de 2 ambientes en Belgrano para alquilar',
    source: 'Zonaprop',
    propertyId: null,
    contactId: null,
    status: 'CONTACTADA',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Roberto Díaz',
    email: 'roberto.d@gmail.com',
    phone: null,
    message: 'Consulta por local comercial en zona centro',
    source: 'Instagram',
    propertyId: null,
    contactId: null,
    status: 'CALIFICADA',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Mónica Ruiz',
    email: 'monica.r@email.com',
    phone: '+54 11 5555-6666',
    message: null,
    source: 'Referido',
    propertyId: null,
    contactId: null,
    status: 'DESCARTADA',
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const getCookieValue = (name: string): string | null => {
  try {
    const match = document.cookie.split(';').find((c) => c.trim().startsWith(name + '='))
    return match ? decodeURIComponent(match.trim().split('=')[1]) : null
  } catch {
    return null
  }
}

interface WaTemplate {
  id: string
  name: string
  message: string
}

const TEMPLATES_KEY = 'wa_templates'

const loadTemplates = (): WaTemplate[] => {
  try {
    if (typeof window === 'undefined') return []
    return JSON.parse(localStorage.getItem(TEMPLATES_KEY) || '[]')
  } catch { return [] }
}

const saveTemplates = (templates: WaTemplate[]) => {
  try { localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates)) } catch { /* ignore */ }
}

const statusTabs = ['Todas', 'NUEVA', 'CONTACTADA', 'CALIFICADA', 'DESCARTADA']

export default function ConsultasPage() {
  const [inquiries, setInquiries] = useState<(Inquiry & { assignedTo?: string | null; assignedUser?: Agent | null })[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Todas')
  const [filterFormulario, setFilterFormulario] = useState('Todos')
  const [sortDateDir, setSortDateDir] = useState<'desc' | 'asc'>('desc')
  const [csvModalOpen, setCsvModalOpen] = useState(false)
  const [csvPreview, setCsvPreview] = useState<(Inquiry & { channel?: string | null; adName?: string | null })[]>([])
  const [csvImporting, setCsvImporting] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedInquiry, setSelectedInquiry] = useState<(Inquiry & { assignedTo?: string | null; assignedUser?: Agent | null }) | null>(null)
  const [pipelineSuccess, setPipelineSuccess] = useState<string | null>(null)
  const [waMessage, setWaMessage] = useState('')
  const [templates, setTemplates] = useState<WaTemplate[]>([])
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<WaTemplate | null>(null)
  const [templateForm, setTemplateForm] = useState({ name: '', message: '' })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTemplates(loadTemplates())
  }, [])

  useEffect(() => {
    const role = getCookieValue('user_role')
    if (role === 'ADMIN') {
      setIsAdmin(true)
      fetchAgents()
    }
    fetchInquiries()
  }, [])

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        setAgents(data)
      }
    } catch {
      // silently fail
    }
  }

  const fetchInquiries = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/inquiries')
      if (res.ok) {
        const data = await res.json()
        setInquiries(data)
      } else {
        setInquiries(mockInquiries)
      }
    } catch {
      setInquiries(mockInquiries)
    } finally {
      setLoading(false)
    }
  }

  // Opciones únicas de formulario
  const formularioOptions = ['Todos', ...Array.from(new Set(inquiries.map(i => i.adName).filter(Boolean))) as string[]]

  const filtered = inquiries
    .filter(i => activeTab === 'Todas' || i.status === activeTab)
    .filter(i => filterFormulario === 'Todos' || i.adName === filterFormulario)
    .sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      return sortDateDir === 'desc' ? -diff : diff
    })

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/inquiries?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setInquiries(inquiries.map((i) => (i.id === id ? { ...i, status } : i)))
      } else {
        setInquiries(inquiries.map((i) => (i.id === id ? { ...i, status } : i)))
      }
    } catch {
      setInquiries(inquiries.map((i) => (i.id === id ? { ...i, status } : i)))
    }
  }

  const handleAssignChange = async (id: string, assignedTo: string) => {
    try {
      const res = await fetch(`/api/inquiries?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: assignedTo || null }),
      })
      if (res.ok) {
        const agent = agents.find((a) => a.id === assignedTo) || null
        setInquiries(
          inquiries.map((i) =>
            i.id === id ? { ...i, assignedTo: assignedTo || null, assignedUser: agent } : i
          )
        )
      }
    } catch {
      // silently fail
    }
  }

  const handlePassToPipeline = async (inquiry: Inquiry & { assignedTo?: string | null }) => {
    try {
      // Crear contacto a partir del lead
      const contactRes = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: inquiry.name, email: inquiry.email, phone: inquiry.phone, type: 'COMPRADOR' }),
      })
      if (!contactRes.ok) throw new Error('No se pudo crear el contacto')
      const contact = await contactRes.json()

      // Crear deal en el pipeline
      const dealTitle = inquiry.adName ? `${inquiry.name} — ${inquiry.adName}` : `Consulta de ${inquiry.name}`
      const dealRes = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: dealTitle,
          contactId: contact.id,
          propertyId: inquiry.propertyId || null,
          stage: 'VISITA',
          notes: inquiry.message || null,
        }),
      })
      if (!dealRes.ok) throw new Error('No se pudo crear el deal')

      // Vincular contacto a la consulta y marcarla como calificada
      await fetch(`/api/inquiries?id=${inquiry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CALIFICADA' }),
      })
      setInquiries(inquiries.map(i => i.id === inquiry.id ? { ...i, status: 'CALIFICADA' } : i))
      setSelectedInquiry(null)
      setPipelineSuccess(`${inquiry.name} fue pasado al pipeline correctamente.`)
      setTimeout(() => setPipelineSuccess(null), 4000)
    } catch {
      alert('No se pudo pasar al pipeline. Intentá de nuevo.')
    }
  }

  const handleAddToContacts = async (inquiry: Inquiry) => {
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: inquiry.name, email: inquiry.email, phone: inquiry.phone, type: 'COMPRADOR' }),
      })
      if (!res.ok) throw new Error()
      setSelectedInquiry(null)
      setPipelineSuccess(`${inquiry.name} fue agregado a Contactos.`)
      setTimeout(() => setPipelineSuccess(null), 4000)
    } catch {
      alert('No se pudo agregar a contactos. Intentá de nuevo.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta consulta?')) return
    try {
      await fetch(`/api/inquiries?id=${id}`, { method: 'DELETE' })
    } catch {
      // continue regardless
    }
    setInquiries(inquiries.filter((i) => i.id !== id))
  }

  const buildWhatsAppUrl = (phone: string, message: string): string => {
    const cleaned = phone.replace(/[\s\-().]/g, '')
    const number = cleaned.startsWith('+')
      ? cleaned.slice(1)
      : cleaned.startsWith('0')
      ? '54' + cleaned.slice(1)
      : '54' + cleaned
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
  }

  const applyTemplate = (template: WaTemplate, name: string) =>
    template.message.replace(/\{nombre\}/g, name)

  const defaultMessage = (name: string) =>
    `Hola ${name}, te contactamos desde Patagonia Desarrolla. ¿En qué podemos ayudarte?`

  const openDetail = (inquiry: Inquiry & { assignedTo?: string | null; assignedUser?: Agent | null }) => {
    setSelectedInquiry(inquiry)
    setWaMessage(defaultMessage(inquiry.name))
  }

  const handleSaveTemplate = () => {
    if (!templateForm.name || !templateForm.message) return
    let updated: WaTemplate[]
    if (editingTemplate) {
      updated = templates.map(t => t.id === editingTemplate.id ? { ...t, ...templateForm } : t)
    } else {
      updated = [...templates, { id: Date.now().toString(), ...templateForm }]
    }
    saveTemplates(updated)
    setTemplates(updated)
    setTemplateForm({ name: '', message: '' })
    setEditingTemplate(null)
  }

  const handleDeleteTemplate = (id: string) => {
    const updated = templates.filter(t => t.id !== id)
    saveTemplates(updated)
    setTemplates(updated)
  }

  // Busca un campo en la fila ignorando BOM, espacios, mayúsculas y acentos
  const getCol = (row: Record<string, string>, ...candidates: string[]): string | null => {
    const normalize = (s: string) =>
      s.replace(/\uFEFF/g, '').trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const rowKeys = Object.keys(row)
    for (const candidate of candidates) {
      const norm = normalize(candidate)
      const found = rowKeys.find(k => normalize(k) === norm)
      if (found !== undefined && row[found] !== undefined && row[found] !== '') {
        return row[found]
      }
    }
    return null
  }

  const parseMetaDate = (dateStr: string): string => {
    if (!dateStr) return new Date().toISOString()
    try {
      const d = new Date(dateStr)
      return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
    } catch {
      return new Date().toISOString()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Columnas que NO son preguntas personalizadas
    const SYSTEM_COLS = new Set([
      'id', 'created_time', 'ad_id', 'ad_name', 'adset_id', 'adset_name',
      'campaign_id', 'campaign_name', 'form_id', 'form_name', 'is_organic',
      'platform', 'email', 'full_name', 'phone_number', 'phone', 'city',
      'province', 'lead_status',
      'fecha de creación', 'fecha de creacion', 'nombre', 'correo electrónico',
      'correo electronico', 'origen', 'formulario', 'canal', 'etapa',
      'propietario', 'etiquetas', 'teléfono', 'telefono',
      'número de teléfono secundario', 'numero de telefono secundario',
      'número de whatsapp', 'numero de whatsapp',
    ])

    const normKey = (s: string) =>
      s.replace(/\uFEFF/g, '').trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')

    const stripPrefix = (v: string) => v.replace(/^[a-z]:/, '').trim()

    const platformLabel: Record<string, string> = { ig: 'Instagram', fb: 'Facebook' }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: '',   // auto-detect (TSV o CSV)
      complete: (results) => {
        const rows = results.data as Record<string, string>[]
        const parsed = rows.map((row, i) => {
          // Preguntas personalizadas: columnas que no son del sistema
          const customLines = Object.entries(row)
            .filter(([k, v]) => !SYSTEM_COLS.has(normKey(k)) && v?.trim())
            .map(([k, v]) => `${k.replace(/_/g, ' ').trim()}: ${v.trim()}`)

          const rawPhone =
            getCol(row, 'phone_number', 'Teléfono', 'telefono', 'phone', 'Número de WhatsApp', 'numero de whatsapp', 'whatsapp') || ''
          const platform = getCol(row, 'platform') || ''
          const adName =
            getCol(row, 'form_name', 'Formulario', 'formulario') || null
          const dateRaw =
            getCol(row, 'created_time', 'Fecha de creación', 'fecha de creacion', 'fecha', 'date') || ''
          const origen = getCol(row, 'ad_name', 'Origen', 'origen') || ''

          return {
            id: `csv-${i}-${Date.now()}`,
            name: getCol(row, 'full_name', 'Nombre', 'nombre completo', 'nombre', 'name') || `Contacto ${i + 1}`,
            email: getCol(row, 'email', 'Correo electrónico', 'correo electronico', 'correo', 'e-mail') || null,
            phone: rawPhone ? stripPrefix(rawPhone) : null,
            message: customLines.length ? customLines.join('\n') : null,
            source: origen || 'CSV Import',
            channel: platformLabel[platform] || getCol(row, 'Canal', 'canal') || null,
            adName,
            city: getCol(row, 'city', 'ciudad') || null,
            province: getCol(row, 'province', 'provincia') || null,
            propertyId: null,
            contactId: null,
            status: 'NUEVA',
            createdAt: parseMetaDate(dateRaw),
            updatedAt: new Date().toISOString(),
          }
        })
        setCsvPreview(parsed)
        setCsvModalOpen(true)
      },
    })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleImportCSV = async () => {
    setCsvImporting(true)
    try {
      for (const inquiry of csvPreview) {
        await fetch('/api/inquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: inquiry.name,
            email: inquiry.email,
            phone: inquiry.phone,
            message: inquiry.message,
            source: inquiry.source,
            channel: inquiry.channel,
            adName: inquiry.adName,
            city: inquiry.city,
            province: inquiry.province,
            status: inquiry.status,
            createdAt: inquiry.createdAt,
          }),
        })
      }
      setInquiries([...csvPreview, ...inquiries])
    } catch {
      setInquiries([...csvPreview, ...inquiries])
    } finally {
      setCsvImporting(false)
      setCsvModalOpen(false)
      setCsvPreview([])
    }
  }

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }

  const counts = statusTabs.reduce((acc, tab) => {
    acc[tab] = tab === 'Todas' ? inquiries.length : inquiries.filter((i) => i.status === tab).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-4">
      {pipelineSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-xl px-4 py-3">
          ✓ {pipelineSuccess}
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Consultas</h2>
          <p className="text-sm text-gray-500">{inquiries.length} consultas en total</p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.tsv,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            variant="secondary"
            onClick={() => { setEditingTemplate(null); setTemplateForm({ name: '', message: '' }); setTemplatesModalOpen(true) }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Plantillas WA
          </Button>
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Importar CSV
          </Button>
        </div>
      </div>

      {/* Filtro Formulario */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-500 whitespace-nowrap">Formulario:</label>
        <select
          value={filterFormulario}
          onChange={e => setFilterFormulario(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {formularioOptions.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      {/* Status Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-1 flex gap-1 overflow-x-auto scrollbar-hide">
        {statusTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {counts[tab]}
            </span>
          </button>
        ))}
      </div>

      {/* Cards (mobile) / Table (desktop) */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm text-center py-12 text-gray-400">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm text-center py-12 text-gray-400">No hay consultas en este estado</div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {filtered.map((inquiry) => (
              <div
                key={inquiry.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3"
                onClick={() => openDetail(inquiry)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">{inquiry.name}</p>
                    <p className="text-xs text-gray-500">{inquiry.source || '-'} · {formatDate(inquiry.createdAt)}</p>
                  </div>
                  <select
                    value={inquiry.status}
                    onChange={(e) => { e.stopPropagation(); handleStatusChange(inquiry.id, e.target.value) }}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none"
                  >
                    <option value="NUEVA">NUEVA</option>
                    <option value="CONTACTADA">CONTACTADA</option>
                    <option value="CALIFICADA">CALIFICADA</option>
                    <option value="DESCARTADA">DESCARTADA</option>
                  </select>
                </div>
                {inquiry.adName && <p className="text-xs font-medium text-blue-600 bg-blue-50 rounded px-2 py-0.5 w-fit">{inquiry.adName}</p>}
                {inquiry.phone && <p className="text-sm text-gray-600">{inquiry.phone}</p>}
                {inquiry.message && (
                  <p className="text-sm text-gray-500 line-clamp-2">{inquiry.message}</p>
                )}
                <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                  {inquiry.phone && (
                    <a href={buildWhatsAppUrl(inquiry.phone, defaultMessage(inquiry.name))} target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-green-50 text-green-600 text-sm font-medium">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.534 5.856L.057 23.885a.5.5 0 00.606.61l6.198-1.625A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.9a9.87 9.87 0 01-5.031-1.374l-.36-.214-3.733.979 1-3.638-.235-.374A9.861 9.861 0 012.1 12C2.1 6.533 6.533 2.1 12 2.1S21.9 6.533 21.9 12 17.467 21.9 12 21.9z"/>
                      </svg>
                      WhatsApp
                    </a>
                  )}
                  <button onClick={() => handleDelete(inquiry.id)}
                    className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Formulario</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Estado</TableHead>
                  {isAdmin && <TableHead>Asignar a</TableHead>}
                  <TableHead
                    className="cursor-pointer select-none hover:text-gray-700"
                    onClick={() => setSortDateDir(d => d === 'desc' ? 'asc' : 'desc')}
                  >
                    Fecha {sortDateDir === 'desc' ? '↓' : '↑'}
                  </TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((inquiry) => (
                  <TableRow key={inquiry.id} className="cursor-pointer hover:bg-gray-50" onClick={() => openDetail(inquiry)}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{inquiry.name}</p>
                        <p className="text-xs text-gray-400">{inquiry.email || ''}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {inquiry.adName
                        ? <span className="text-xs font-medium text-blue-600 bg-blue-50 rounded px-2 py-0.5">{inquiry.adName}</span>
                        : <span className="text-gray-400">-</span>}
                    </TableCell>
                    <TableCell className="text-gray-500">{inquiry.phone || '-'}</TableCell>
                    <TableCell className="text-gray-500">{inquiry.source || '-'}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <select
                        value={inquiry.status}
                        onChange={(e) => handleStatusChange(inquiry.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                      >
                        <option value="NUEVA">NUEVA</option>
                        <option value="CONTACTADA">CONTACTADA</option>
                        <option value="CALIFICADA">CALIFICADA</option>
                        <option value="DESCARTADA">DESCARTADA</option>
                      </select>
                    </TableCell>
                    {isAdmin && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <select
                          value={inquiry.assignedTo || ''}
                          onChange={(e) => handleAssignChange(inquiry.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white min-w-28"
                        >
                          <option value="">Sin asignar</option>
                          {agents.map((agent) => (
                            <option key={agent.id} value={agent.id}>{agent.name}</option>
                          ))}
                        </select>
                      </TableCell>
                    )}
                    <TableCell className="text-gray-500">{formatDate(inquiry.createdAt)}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        {inquiry.phone && (
                          <a href={buildWhatsAppUrl(inquiry.phone, defaultMessage(inquiry.name))} target="_blank" rel="noopener noreferrer"
                            title="Contactar por WhatsApp"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 transition-colors">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.534 5.856L.057 23.885a.5.5 0 00.606.61l6.198-1.625A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.9a9.87 9.87 0 01-5.031-1.374l-.36-.214-3.733.979 1-3.638-.235-.374A9.861 9.861 0 012.1 12C2.1 6.533 6.533 2.1 12 2.1S21.9 6.533 21.9 12 17.467 21.9 12 21.9z"/>
                            </svg>
                          </a>
                        )}
                        {inquiry.status === 'CALIFICADA' && (
                          <Button size="sm" onClick={() => handlePassToPipeline(inquiry)}>Pipeline</Button>
                        )}
                        <button onClick={() => handleDelete(inquiry.id)} title="Eliminar"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Detail Modal */}
      <Modal open={!!selectedInquiry} onClose={() => setSelectedInquiry(null)} title="Detalle del lead" size="2xl">
        {selectedInquiry && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-lg font-bold flex-shrink-0">
                {selectedInquiry.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-lg">{selectedInquiry.name}</p>
                <p className="text-sm text-gray-500">{formatDate(selectedInquiry.createdAt)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className={`rounded-lg px-4 py-3 ${selectedInquiry.adName ? 'bg-blue-50' : 'bg-gray-50'}`}>
                <p className={`text-xs mb-0.5 ${selectedInquiry.adName ? 'text-blue-400' : 'text-gray-400'}`}>Formulario / Anuncio</p>
                <p className={`text-sm font-medium ${selectedInquiry.adName ? 'text-blue-700' : 'text-gray-400'}`}>
                  {selectedInquiry.adName || 'Sin formulario asociado'}
                </p>
              </div>
              {selectedInquiry.email && (
                <div className="bg-gray-50 rounded-lg px-4 py-3">
                  <p className="text-xs text-gray-400 mb-0.5">Email</p>
                  <p className="text-sm text-gray-800">{selectedInquiry.email}</p>
                </div>
              )}
              {selectedInquiry.phone && (
                <div className="bg-gray-50 rounded-lg px-4 py-3">
                  <p className="text-xs text-gray-400 mb-0.5">Teléfono</p>
                  <p className="text-sm text-gray-800">{selectedInquiry.phone}</p>
                </div>
              )}
              {selectedInquiry.source && (
                <div className="bg-gray-50 rounded-lg px-4 py-3">
                  <p className="text-xs text-gray-400 mb-0.5">Origen</p>
                  <p className="text-sm text-gray-800">{selectedInquiry.source}</p>
                </div>
              )}
              {(selectedInquiry.city || selectedInquiry.province) && (
                <div className="bg-gray-50 rounded-lg px-4 py-3">
                  <p className="text-xs text-gray-400 mb-0.5">Ubicación</p>
                  <p className="text-sm text-gray-800">
                    {[selectedInquiry.city, selectedInquiry.province].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}
              {selectedInquiry.message && (
                <div className="bg-gray-50 rounded-lg px-4 py-3">
                  <p className="text-xs text-gray-400 mb-2">Respuestas del formulario</p>
                  <div className="space-y-2">
                    {selectedInquiry.message.split('\n').filter(Boolean).map((line, i) => {
                      const colon = line.indexOf(':')
                      if (colon === -1) return <p key={i} className="text-sm text-gray-800">{line}</p>
                      const rawKey = line.slice(0, colon).trim()
                      const val = line.slice(colon + 1).trim()
                      const label = rawKey.replace(/_/g, ' ').replace(/^\d+\.\s*/, '').replace(/\?$/, '').trim()
                      return (
                        <div key={i}>
                          <p className="text-xs text-gray-400 leading-tight">{label}?</p>
                          <p className="text-sm font-medium text-gray-800 break-words">{val || '—'}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="flex gap-2 flex-wrap">
              <Button variant="secondary" onClick={() => handleAddToContacts(selectedInquiry)}>
                + Agregar a Contactos
              </Button>
              <Button onClick={() => handlePassToPipeline(selectedInquiry)}>
                → Pasar al Pipeline
              </Button>
            </div>

            {selectedInquiry.phone && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Mensaje de WhatsApp</p>

                {templates.length > 0 && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Usar plantilla</label>
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        const t = templates.find(t => t.id === e.target.value)
                        if (t) setWaMessage(applyTemplate(t, selectedInquiry.name))
                      }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="">Seleccionar plantilla...</option>
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs text-gray-400 mb-1">O escribí el mensaje</label>
                  <textarea
                    value={waMessage}
                    onChange={(e) => setWaMessage(e.target.value)}
                    rows={4}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                  />
                </div>

                <a
                  href={buildWhatsAppUrl(selectedInquiry.phone, waMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-medium transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.534 5.856L.057 23.885a.5.5 0 00.606.61l6.198-1.625A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.9a9.87 9.87 0 01-5.031-1.374l-.36-.214-3.733.979 1-3.638-.235-.374A9.861 9.861 0 012.1 12C2.1 6.533 6.533 2.1 12 2.1S21.9 6.533 21.9 12 17.467 21.9 12 21.9z"/>
                  </svg>
                  Enviar por WhatsApp
                </a>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Templates Modal */}
      <Modal
        open={templatesModalOpen}
        onClose={() => setTemplatesModalOpen(false)}
        title="Plantillas de WhatsApp"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500">Usá <strong>{'{nombre}'}</strong> en el mensaje y se reemplazará con el nombre del lead.</p>

          {/* Existing templates */}
          {templates.length > 0 && (
            <div className="space-y-2">
              {templates.map(t => (
                <div key={t.id} className="border border-gray-200 rounded-lg p-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{t.message}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => { setEditingTemplate(t); setTemplateForm({ name: t.name, message: t.message }) }}
                      className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded">Editar</button>
                    <button onClick={() => handleDeleteTemplate(t.id)}
                      className="text-xs text-red-500 hover:text-red-600 px-2 py-1 rounded">Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Form */}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">{editingTemplate ? 'Editar plantilla' : 'Nueva plantilla'}</p>
            <input
              type="text"
              placeholder="Nombre de la plantilla (ej: Casa en Palermo)"
              value={templateForm.name}
              onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <textarea
              placeholder={`Hola {nombre}, te contactamos por la casa en Palermo...`}
              value={templateForm.message}
              onChange={e => setTemplateForm({ ...templateForm, message: e.target.value })}
              rows={4}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
            <div className="flex gap-2 justify-end">
              {editingTemplate && (
                <Button variant="secondary" onClick={() => { setEditingTemplate(null); setTemplateForm({ name: '', message: '' }) }}>
                  Cancelar
                </Button>
              )}
              <Button onClick={handleSaveTemplate}>
                {editingTemplate ? 'Guardar cambios' : 'Crear plantilla'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* CSV Preview Modal */}
      <Modal
        open={csvModalOpen}
        onClose={() => { setCsvModalOpen(false); setCsvPreview([]) }}
        title={`Importar CSV - ${csvPreview.length} registros`}
        size="xl"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Se importarán {csvPreview.length} consultas. Vista previa de los primeros 5:
          </p>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Nombre</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Email</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Teléfono</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Mensaje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {csvPreview.slice(0, 5).map((row) => (
                  <tr key={row.id}>
                    <td className="px-3 py-2">{row.name}</td>
                    <td className="px-3 py-2 text-gray-500">{row.email || '-'}</td>
                    <td className="px-3 py-2 text-gray-500">{row.phone || '-'}</td>
                    <td className="px-3 py-2 text-gray-500 max-w-32 truncate">{row.message || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setCsvModalOpen(false); setCsvPreview([]) }}>Cancelar</Button>
            <Button onClick={handleImportCSV} loading={csvImporting}>
              Importar {csvPreview.length} consultas
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import type { Campaign } from '@/types'

const mockCampaigns: Campaign[] = [
  {
    id: '1',
    title: 'Newsletter Marzo 2025',
    type: 'NEWSLETTER',
    subject: 'Novedades inmobiliarias - Marzo 2025',
    content: 'Estimado cliente, le presentamos las últimas novedades...',
    status: 'ENVIADA',
    sentAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    recipients: [],
  },
  {
    id: '2',
    title: 'Flyer Propiedades Destacadas',
    type: 'FLYER',
    subject: 'Propiedades destacadas del mes',
    content: null,
    status: 'BORRADOR',
    sentAt: null,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    recipients: [],
  },
  {
    id: '3',
    title: 'Newsletter Abril 2025',
    type: 'NEWSLETTER',
    subject: 'Tendencias del mercado inmobiliario',
    content: null,
    status: 'PROGRAMADA',
    sentAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    recipients: [],
  },
]

const mockMetrics: Record<string, { sent: number; opened: number; clicked: number }> = {
  '1': { sent: 234, opened: 102, clicked: 47 },
  '2': { sent: 0, opened: 0, clicked: 0 },
  '3': { sent: 0, opened: 0, clicked: 0 },
}

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  BORRADOR: 'default',
  ENVIADA: 'success',
  PROGRAMADA: 'info',
}

const typeVariant: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  NEWSLETTER: 'info',
  FLYER: 'warning',
}

const templates = [
  { id: 'newsletter_basic', label: 'Newsletter básico', type: 'NEWSLETTER' },
  { id: 'newsletter_properties', label: 'Propiedades destacadas', type: 'NEWSLETTER' },
  { id: 'flyer_promo', label: 'Flyer promocional', type: 'FLYER' },
  { id: 'flyer_new', label: 'Nuevas propiedades', type: 'FLYER' },
]

const templateContent: Record<string, string> = {
  newsletter_basic: 'Estimado cliente,\n\nLe presentamos las últimas novedades del mercado inmobiliario...\n\nSaludos,\nEl equipo de InmoCRM',
  newsletter_properties: 'Estimado cliente,\n\nEstas son las propiedades destacadas del mes:\n\n- Propiedad 1\n- Propiedad 2\n- Propiedad 3\n\nContáctenos para más información.',
  flyer_promo: '🏠 OPORTUNIDADES ÚNICAS\n\nPropiedades en venta y alquiler a precios especiales.\nNo te pierdas estas ofertas exclusivas.',
  flyer_new: '✨ NUEVAS PROPIEDADES\n\nAcabamos de incorporar estas propiedades a nuestro catálogo.\nVisítalas y encontrá tu próximo hogar.',
}

const emptyForm = {
  title: '',
  type: 'NEWSLETTER',
  subject: '',
  content: '',
  template: '',
}

export default function CampaniasPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/campaigns')
      if (res.ok) {
        const data = await res.json()
        setCampaigns(data.length > 0 ? data : mockCampaigns)
      } else {
        setCampaigns(mockCampaigns)
      }
    } catch {
      setCampaigns(mockCampaigns)
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateChange = (templateId: string) => {
    const content = templateContent[templateId] || ''
    setForm({ ...form, template: templateId, content })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, type: form.type, subject: form.subject, content: form.content }),
      })
      if (res.ok) {
        const created = await res.json()
        setCampaigns([created, ...campaigns])
      } else {
        const newCampaign: Campaign = {
          id: String(Date.now()),
          title: form.title,
          type: form.type,
          subject: form.subject || null,
          content: form.content || null,
          status: 'BORRADOR',
          sentAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          recipients: [],
        }
        setCampaigns([newCampaign, ...campaigns])
      }
      setModalOpen(false)
      setForm(emptyForm)
    } catch {
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDuplicate = (campaign: Campaign) => {
    const copy: Campaign = {
      ...campaign,
      id: String(Date.now()),
      title: `${campaign.title} (copia)`,
      status: 'BORRADOR',
      sentAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      recipients: [],
    }
    setCampaigns([copy, ...campaigns])
  }

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const getMetrics = (id: string) => {
    const m = mockMetrics[id] || { sent: 0, opened: 0, clicked: 0 }
    return m
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Campañas</h2>
          <p className="text-sm text-gray-500">{campaigns.length} campañas</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Campaña
        </Button>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaña</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Enviados</TableHead>
                <TableHead>Abiertos</TableHead>
                <TableHead>Clics</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => {
                const metrics = getMetrics(campaign.id)
                const openRate = metrics.sent > 0 ? Math.round((metrics.opened / metrics.sent) * 100) : 0
                const clickRate = metrics.sent > 0 ? Math.round((metrics.clicked / metrics.sent) * 100) : 0

                return (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{campaign.title}</p>
                        {campaign.subject && <p className="text-xs text-gray-500">{campaign.subject}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={typeVariant[campaign.type] || 'default'}>{campaign.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[campaign.status] || 'default'}>{campaign.status}</Badge>
                    </TableCell>
                    <TableCell className="text-gray-700">{metrics.sent > 0 ? metrics.sent : '-'}</TableCell>
                    <TableCell>
                      {metrics.sent > 0 ? (
                        <div className="flex items-center gap-2">
                          <span>{metrics.opened}</span>
                          <span className="text-xs text-gray-400">({openRate}%)</span>
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {metrics.sent > 0 ? (
                        <div className="flex items-center gap-2">
                          <span>{metrics.clicked}</span>
                          <span className="text-xs text-gray-400">({clickRate}%)</span>
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {campaign.status === 'ENVIADA' ? formatDate(campaign.sentAt) :
                        campaign.status === 'PROGRAMADA' ? `Prog. ${formatDate(campaign.sentAt)}` :
                        formatDate(campaign.createdAt)}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleDuplicate(campaign)}
                        className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
                        title="Duplicar campaña"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {campaigns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-400 py-8">No hay campañas aún</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nueva Campaña"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Título de la campaña"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Newsletter Abril 2025"
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              options={[
                { value: 'NEWSLETTER', label: 'Newsletter' },
                { value: 'FLYER', label: 'Flyer' },
              ]}
            />
            <Select
              label="Plantilla"
              value={form.template}
              onChange={(e) => handleTemplateChange(e.target.value)}
              options={[
                { value: '', label: 'Sin plantilla' },
                ...templates.filter((t) => t.type === form.type).map((t) => ({ value: t.id, label: t.label })),
              ]}
            />
          </div>
          <Input
            label="Asunto"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="Novedades inmobiliarias - Abril 2025"
          />
          <Textarea
            label="Contenido"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Contenido de la campaña..."
            rows={6}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}>Crear campaña</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import type { Deal } from '@/types'

const mockDeals: Deal[] = [
  {
    id: '1',
    title: 'Venta Casa Palermo',
    contactId: '1',
    propertyId: '1',
    stage: 'VISITA',
    status: 'ACTIVA',
    value: 250000,
    notes: 'Primera visita agendada para el viernes',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    contact: { id: '1', name: 'María García', email: 'maria@email.com', phone: null, type: 'COMPRADOR', notes: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    property: { id: '1', title: 'Casa en Palermo', description: null, type: 'CASA', operation: 'VENTA', status: 'DISPONIBLE', price: 250000, currency: 'USD', address: 'Thames 1234', city: 'Buenos Aires', neighborhood: 'Palermo', bedrooms: 3, bathrooms: 2, area: 180, images: [], features: [], userId: 'demo', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  },
  {
    id: '2',
    title: 'Alquiler Depto Belgrano',
    contactId: '3',
    propertyId: '2',
    stage: 'OFERTA',
    status: 'ACTIVA',
    value: 150000,
    notes: 'Oferta presentada, esperando respuesta',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    contact: { id: '3', name: 'Ana López', email: 'ana@email.com', phone: null, type: 'INQUILINO', notes: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    property: { id: '2', title: 'Depto en Belgrano', description: null, type: 'DEPARTAMENTO', operation: 'ALQUILER', status: 'DISPONIBLE', price: 150000, currency: 'ARS', address: 'Av. Cabildo 2345', city: 'Buenos Aires', neighborhood: 'Belgrano', bedrooms: 2, bathrooms: 1, area: 75, images: [], features: [], userId: 'demo', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  },
  {
    id: '3',
    title: 'Venta Oficina Centro',
    contactId: '2',
    propertyId: '3',
    stage: 'RESERVA',
    status: 'ACTIVA',
    value: 80000,
    notes: 'Seña pagada, escritura en 30 días',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    contact: { id: '2', name: 'Carlos Rodríguez', email: 'carlos@email.com', phone: null, type: 'VENDEDOR', notes: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    property: { id: '3', title: 'Oficina en Microcentro', description: null, type: 'OFICINA', operation: 'ALQUILER', status: 'RESERVADA', price: 80000, currency: 'ARS', address: 'Florida 500', city: 'Buenos Aires', neighborhood: 'Microcentro', bedrooms: null, bathrooms: 1, area: 50, images: [], features: [], userId: 'demo', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  },
]

const stages = ['VISITA', 'OFERTA', 'RESERVA', 'CIERRE']

const stageColors: Record<string, string> = {
  VISITA: 'bg-blue-50 border-blue-200',
  OFERTA: 'bg-yellow-50 border-yellow-200',
  RESERVA: 'bg-orange-50 border-orange-200',
  CIERRE: 'bg-green-50 border-green-200',
}

const stageHeaderColors: Record<string, string> = {
  VISITA: 'bg-blue-500',
  OFERTA: 'bg-yellow-500',
  RESERVA: 'bg-orange-500',
  CIERRE: 'bg-green-500',
}

const emptyForm = {
  title: '',
  contactName: '',
  propertyTitle: '',
  stage: 'VISITA',
  value: '',
  notes: '',
}

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchDeals()
  }, [])

  const fetchDeals = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/deals')
      if (res.ok) {
        const data = await res.json()
        setDeals(data.length > 0 ? data : mockDeals)
      } else {
        setDeals(mockDeals)
      }
    } catch {
      setDeals(mockDeals)
    } finally {
      setLoading(false)
    }
  }

  const activeDeals = deals.filter((d) => d.status === 'ACTIVA')

  const moveToStage = async (dealId: string, stage: string) => {
    try {
      await fetch(`/api/deals?id=${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      })
    } catch { /* ignore */ }
    setDeals(deals.map((d) => (d.id === dealId ? { ...d, stage } : d)))
  }

  const updateStatus = async (dealId: string, status: string) => {
    try {
      await fetch(`/api/deals?id=${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
    } catch { /* ignore */ }
    setDeals(deals.map((d) => (d.id === dealId ? { ...d, status } : d)))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const newDeal: Deal = {
        id: String(Date.now()),
        title: form.title,
        contactId: 'demo',
        propertyId: null,
        stage: form.stage,
        status: 'ACTIVA',
        value: form.value ? parseFloat(form.value) : null,
        notes: form.notes || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        contact: { id: 'demo', name: form.contactName, email: null, phone: null, type: 'COMPRADOR', notes: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        property: form.propertyTitle ? { id: 'demo-prop', title: form.propertyTitle, description: null, type: 'CASA', operation: 'VENTA', status: 'DISPONIBLE', price: 0, currency: 'USD', address: '', city: '', neighborhood: null, bedrooms: null, bathrooms: null, area: null, images: [], features: [], userId: 'demo', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : null,
      }

      try {
        const res = await fetch('/api/deals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: form.title, stage: form.stage, value: form.value ? parseFloat(form.value) : null, notes: form.notes }),
        })
        if (res.ok) {
          const created = await res.json()
          setDeals([...deals, created])
        } else {
          setDeals([...deals, newDeal])
        }
      } catch {
        setDeals([...deals, newDeal])
      }
      setModalOpen(false)
      setForm(emptyForm)
    } finally {
      setSaving(false)
    }
  }

  const formatPrice = (value: number | null | undefined) => {
    if (!value) return null
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value)
  }

  const getStageIndex = (stage: string) => stages.indexOf(stage)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Pipeline de Ventas</h2>
          <p className="text-sm text-gray-500">{activeDeals.length} operaciones activas</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Operación
        </Button>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stages.map((stage) => {
            const stageDeals = activeDeals.filter((d) => d.stage === stage)
            const totalValue = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0)

            return (
              <div key={stage} className={`rounded-xl border-2 ${stageColors[stage]} p-1`}>
                {/* Column Header */}
                <div className={`${stageHeaderColors[stage]} rounded-lg px-3 py-2 mb-2`}>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold text-sm">{stage}</span>
                    <span className="text-white/80 text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
                      {stageDeals.length}
                    </span>
                  </div>
                  {totalValue > 0 && (
                    <p className="text-white/70 text-xs mt-0.5">{formatPrice(totalValue)}</p>
                  )}
                </div>

                {/* Cards */}
                <div className="space-y-2 min-h-32">
                  {stageDeals.map((deal) => (
                    <div key={deal.id} className="bg-white rounded-lg p-3 shadow-sm border border-white/60">
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">{deal.title}</h4>
                      {deal.contact && (
                        <p className="text-xs text-gray-500 mb-1">
                          <span className="font-medium">Contacto:</span> {deal.contact.name}
                        </p>
                      )}
                      {deal.property && (
                        <p className="text-xs text-gray-500 mb-1">
                          <span className="font-medium">Propiedad:</span> {deal.property.title}
                        </p>
                      )}
                      {deal.value && (
                        <p className="text-xs font-semibold text-green-600 mb-2">{formatPrice(deal.value)}</p>
                      )}
                      {deal.notes && (
                        <p className="text-xs text-gray-400 mb-2 italic">{deal.notes}</p>
                      )}

                      {/* Move buttons */}
                      <div className="flex gap-1 flex-wrap mt-2">
                        {getStageIndex(stage) > 0 && (
                          <button
                            onClick={() => moveToStage(deal.id, stages[getStageIndex(stage) - 1])}
                            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors"
                          >
                            ← Retroceder
                          </button>
                        )}
                        {getStageIndex(stage) < stages.length - 1 && (
                          <button
                            onClick={() => moveToStage(deal.id, stages[getStageIndex(stage) + 1])}
                            className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                          >
                            Avanzar →
                          </button>
                        )}
                      </div>

                      <div className="flex gap-1 mt-1">
                        <button
                          onClick={() => updateStatus(deal.id, 'GANADA')}
                          className="text-xs px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
                        >
                          ✓ Ganada
                        </button>
                        <button
                          onClick={() => updateStatus(deal.id, 'PERDIDA')}
                          className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                        >
                          ✕ Perdida
                        </button>
                      </div>
                    </div>
                  ))}
                  {stageDeals.length === 0 && (
                    <div className="text-center py-6 text-gray-300 text-xs">Sin operaciones</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Deals ganados/perdidos */}
      {deals.filter((d) => d.status !== 'ACTIVA').length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Operaciones cerradas</h3>
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{deals.filter((d) => d.status === 'GANADA').length}</p>
              <p className="text-xs text-gray-500">Ganadas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{deals.filter((d) => d.status === 'PERDIDA').length}</p>
              <p className="text-xs text-gray-500">Perdidas</p>
            </div>
          </div>
        </div>
      )}

      {/* New Deal Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nueva Operación"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Título de la operación"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Venta Casa Palermo"
          />
          <Input
            label="Nombre del contacto"
            value={form.contactName}
            onChange={(e) => setForm({ ...form, contactName: e.target.value })}
            placeholder="María García"
          />
          <Input
            label="Propiedad (opcional)"
            value={form.propertyTitle}
            onChange={(e) => setForm({ ...form, propertyTitle: e.target.value })}
            placeholder="Casa en Palermo"
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Etapa"
              value={form.stage}
              onChange={(e) => setForm({ ...form, stage: e.target.value })}
              options={[
                { value: 'VISITA', label: 'Visita' },
                { value: 'OFERTA', label: 'Oferta' },
                { value: 'RESERVA', label: 'Reserva' },
                { value: 'CIERRE', label: 'Cierre' },
              ]}
            />
            <Input
              label="Valor (USD)"
              type="number"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              placeholder="250000"
            />
          </div>
          <Textarea
            label="Notas"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Notas sobre la operación..."
            rows={3}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}>Crear operación</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

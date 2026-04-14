'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import type { Property } from '@/types'

const mockProperties: Property[] = [
  {
    id: '1',
    title: 'Casa en Palermo',
    description: 'Hermosa casa con jardín',
    type: 'CASA',
    operation: 'VENTA',
    status: 'DISPONIBLE',
    price: 250000,
    currency: 'USD',
    address: 'Thames 1234',
    city: 'Buenos Aires',
    neighborhood: 'Palermo',
    bedrooms: 3,
    bathrooms: 2,
    area: 180,
    images: [],
    features: [],
    userId: 'demo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Departamento en Belgrano',
    description: 'Moderno depto con amenities',
    type: 'DEPARTAMENTO',
    operation: 'ALQUILER',
    status: 'DISPONIBLE',
    price: 150000,
    currency: 'ARS',
    address: 'Av. Cabildo 2345',
    city: 'Buenos Aires',
    neighborhood: 'Belgrano',
    bedrooms: 2,
    bathrooms: 1,
    area: 75,
    images: [],
    features: [],
    userId: 'demo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Oficina en Microcentro',
    description: 'Oficina lista para usar',
    type: 'OFICINA',
    operation: 'ALQUILER',
    status: 'RESERVADA',
    price: 80000,
    currency: 'ARS',
    address: 'Florida 500',
    city: 'Buenos Aires',
    neighborhood: 'Microcentro',
    bedrooms: null,
    bathrooms: 1,
    area: 50,
    images: [],
    features: [],
    userId: 'demo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  DISPONIBLE: 'success',
  RESERVADA: 'warning',
  VENDIDA: 'info',
  ALQUILADA: 'info',
  INACTIVA: 'danger',
}

const operationColors: Record<string, string> = {
  VENTA: 'bg-blue-100 text-blue-700',
  ALQUILER: 'bg-green-100 text-green-700',
  ALQUILER_TEMP: 'bg-purple-100 text-purple-700',
}

const emptyForm = {
  title: '',
  description: '',
  type: 'CASA',
  operation: 'VENTA',
  status: 'DISPONIBLE',
  price: '',
  currency: 'USD',
  address: '',
  city: '',
  neighborhood: '',
  bedrooms: '',
  bathrooms: '',
  area: '',
}

export default function PropiedadesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const [filterOp, setFilterOp] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editProp, setEditProp] = useState<Property | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/properties')
      if (res.ok) {
        const data = await res.json()
        setProperties(data.length > 0 ? data : mockProperties)
      } else {
        setProperties(mockProperties)
      }
    } catch {
      setProperties(mockProperties)
    } finally {
      setLoading(false)
    }
  }

  const filtered = properties.filter((p) => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.address.toLowerCase().includes(search.toLowerCase())
    const matchTipo = !filterTipo || p.type === filterTipo
    const matchOp = !filterOp || p.operation === filterOp
    const matchStatus = !filterStatus || p.status === filterStatus
    return matchSearch && matchTipo && matchOp && matchStatus
  })

  const openCreate = () => {
    setEditProp(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (p: Property) => {
    setEditProp(p)
    setForm({
      title: p.title,
      description: p.description || '',
      type: p.type,
      operation: p.operation,
      status: p.status,
      price: String(p.price),
      currency: p.currency,
      address: p.address,
      city: p.city,
      neighborhood: p.neighborhood || '',
      bedrooms: p.bedrooms != null ? String(p.bedrooms) : '',
      bathrooms: p.bathrooms != null ? String(p.bathrooms) : '',
      area: p.area != null ? String(p.area) : '',
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const body = {
        ...form,
        price: parseFloat(form.price) || 0,
        bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
        area: form.area ? parseFloat(form.area) : null,
      }

      if (editProp) {
        const res = await fetch(`/api/properties?id=${editProp.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (res.ok) {
          const updated = await res.json()
          setProperties(properties.map((p) => (p.id === editProp.id ? updated : p)))
        }
      } else {
        const res = await fetch('/api/properties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (res.ok) {
          const created = await res.json()
          setProperties([created, ...properties])
        }
      }
      setModalOpen(false)
    } catch {
      // silently fail for demo
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/properties?id=${id}`, { method: 'DELETE' })
      setProperties(properties.filter((p) => p.id !== id))
    } catch {
      setProperties(properties.filter((p) => p.id !== id))
    }
    setDeleteId(null)
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency === 'USD' ? 'USD' : 'ARS',
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Propiedades</h2>
          <p className="text-sm text-gray-500">{filtered.length} propiedades</p>
        </div>
        <Button onClick={openCreate}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Propiedad
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-48">
            <Input
              placeholder="Buscar propiedades..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>
          <Select
            options={[
              { value: '', label: 'Todos los tipos' },
              { value: 'CASA', label: 'Casa' },
              { value: 'DEPARTAMENTO', label: 'Departamento' },
              { value: 'OFICINA', label: 'Oficina' },
              { value: 'LOCAL', label: 'Local' },
              { value: 'TERRENO', label: 'Terreno' },
              { value: 'COCHERA', label: 'Cochera' },
            ]}
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="w-44"
          />
          <Select
            options={[
              { value: '', label: 'Todas las operaciones' },
              { value: 'VENTA', label: 'Venta' },
              { value: 'ALQUILER', label: 'Alquiler' },
              { value: 'ALQUILER_TEMP', label: 'Alquiler Temp.' },
            ]}
            value={filterOp}
            onChange={(e) => setFilterOp(e.target.value)}
            className="w-48"
          />
          <Select
            options={[
              { value: '', label: 'Todos los estados' },
              { value: 'DISPONIBLE', label: 'Disponible' },
              { value: 'RESERVADA', label: 'Reservada' },
              { value: 'VENDIDA', label: 'Vendida' },
              { value: 'ALQUILADA', label: 'Alquilada' },
              { value: 'INACTIVA', label: 'Inactiva' },
            ]}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-44"
          />
          {/* View toggle */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden ml-auto">
            <button
              onClick={() => setView('grid')}
              className={`p-2 ${view === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-2 ${view === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((prop) => (
            <div key={prop.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              {/* Image placeholder */}
              <div className="h-40 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight">{prop.title}</h3>
                  <Badge variant={statusVariant[prop.status] || 'default'}>{prop.status}</Badge>
                </div>
                <p className="text-xs text-gray-500 mb-2">{prop.address}, {prop.city}</p>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${operationColors[prop.operation] || 'bg-gray-100 text-gray-700'}`}>
                    {prop.operation}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{prop.type}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                  {prop.bedrooms && <span>{prop.bedrooms} amb.</span>}
                  {prop.bathrooms && <span>{prop.bathrooms} baños</span>}
                  {prop.area && <span>{prop.area} m²</span>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">{formatPrice(prop.price, prop.currency)}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(prop)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeleteId(prop.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-12 text-gray-400">No se encontraron propiedades</div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Operación</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((prop) => (
                <TableRow key={prop.id}>
                  <TableCell className="font-medium">{prop.title}</TableCell>
                  <TableCell>{prop.type}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${operationColors[prop.operation] || 'bg-gray-100 text-gray-700'}`}>
                      {prop.operation}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{formatPrice(prop.price, prop.currency)}</TableCell>
                  <TableCell className="text-gray-500">{prop.city}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[prop.status] || 'default'}>{prop.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(prop)} className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => setDeleteId(prop.id)} className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-400 py-8">No se encontraron propiedades</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editProp ? 'Editar Propiedad' : 'Nueva Propiedad'}
        size="xl"
      >
        <div className="space-y-4">
          <Input
            label="Título"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Casa en Palermo"
          />
          <Textarea
            label="Descripción"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Descripción de la propiedad..."
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              options={[
                { value: 'CASA', label: 'Casa' },
                { value: 'DEPARTAMENTO', label: 'Departamento' },
                { value: 'OFICINA', label: 'Oficina' },
                { value: 'LOCAL', label: 'Local' },
                { value: 'TERRENO', label: 'Terreno' },
                { value: 'COCHERA', label: 'Cochera' },
              ]}
            />
            <Select
              label="Operación"
              value={form.operation}
              onChange={(e) => setForm({ ...form, operation: e.target.value })}
              options={[
                { value: 'VENTA', label: 'Venta' },
                { value: 'ALQUILER', label: 'Alquiler' },
                { value: 'ALQUILER_TEMP', label: 'Alquiler Temporal' },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Precio"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="250000"
            />
            <Select
              label="Moneda"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              options={[
                { value: 'USD', label: 'USD' },
                { value: 'ARS', label: 'ARS' },
              ]}
            />
          </div>
          <Input
            label="Dirección"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Thames 1234"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Ciudad"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="Buenos Aires"
            />
            <Input
              label="Barrio"
              value={form.neighborhood}
              onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
              placeholder="Palermo"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Ambientes"
              type="number"
              value={form.bedrooms}
              onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
              placeholder="3"
            />
            <Input
              label="Baños"
              type="number"
              value={form.bathrooms}
              onChange={(e) => setForm({ ...form, bathrooms: e.target.value })}
              placeholder="2"
            />
            <Input
              label="Superficie m²"
              type="number"
              value={form.area}
              onChange={(e) => setForm({ ...form, area: e.target.value })}
              placeholder="180"
            />
          </div>
          <Select
            label="Estado"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={[
              { value: 'DISPONIBLE', label: 'Disponible' },
              { value: 'RESERVADA', label: 'Reservada' },
              { value: 'VENDIDA', label: 'Vendida' },
              { value: 'ALQUILADA', label: 'Alquilada' },
              { value: 'INACTIVA', label: 'Inactiva' },
            ]}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}>
              {editProp ? 'Guardar cambios' : 'Crear propiedad'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Confirmar eliminación"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-6">¿Estás seguro de que querés eliminar esta propiedad? Esta acción no se puede deshacer.</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button variant="danger" onClick={() => deleteId && handleDelete(deleteId)}>Eliminar</Button>
        </div>
      </Modal>
    </div>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import type { Contact } from '@/types'

const mockContacts: Contact[] = [
  {
    id: '1',
    name: 'María García',
    email: 'maria.garcia@email.com',
    phone: '+54 11 4567-8901',
    type: 'COMPRADOR',
    notes: 'Interesada en propiedades en Palermo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Carlos Rodríguez',
    email: 'carlos.r@email.com',
    phone: '+54 11 2345-6789',
    type: 'PROPIETARIO',
    notes: 'Tiene 3 propiedades para vender',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Ana López',
    email: 'ana.lopez@email.com',
    phone: '+54 9 11 8765-4321',
    type: 'INQUILINO',
    notes: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Juan Martínez',
    email: null,
    phone: '+54 9 11 1111-2222',
    type: 'VENDEDOR',
    notes: 'Contactado por referido',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const typeVariant: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  COMPRADOR: 'info',
  VENDEDOR: 'success',
  INQUILINO: 'warning',
  PROPIETARIO: 'default',
}

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  type: 'COMPRADOR',
  notes: '',
}

export default function ContactosPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editContact, setEditContact] = useState<Contact | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/contacts')
      if (res.ok) {
        const data = await res.json()
        setContacts(data.length > 0 ? data : mockContacts)
      } else {
        setContacts(mockContacts)
      }
    } catch {
      setContacts(mockContacts)
    } finally {
      setLoading(false)
    }
  }

  const filtered = contacts.filter((c) => {
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || '').includes(search)
    const matchType = !filterType || c.type === filterType
    return matchSearch && matchType
  })

  const openCreate = () => {
    setEditContact(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (c: Contact) => {
    setEditContact(c)
    setForm({
      name: c.name,
      email: c.email || '',
      phone: c.phone || '',
      type: c.type,
      notes: c.notes || '',
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editContact) {
        const res = await fetch(`/api/contacts?id=${editContact.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (res.ok) {
          const updated = await res.json()
          setContacts(contacts.map((c) => (c.id === editContact.id ? updated : c)))
        } else {
          // Update locally for demo
          setContacts(contacts.map((c) => c.id === editContact.id ? { ...c, ...form, updatedAt: new Date().toISOString() } : c))
        }
      } else {
        const res = await fetch('/api/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (res.ok) {
          const created = await res.json()
          setContacts([created, ...contacts])
        } else {
          // Add locally for demo
          const newContact: Contact = {
            id: String(Date.now()),
            ...form,
            email: form.email || null,
            phone: form.phone || null,
            notes: form.notes || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          setContacts([newContact, ...contacts])
        }
      }
      setModalOpen(false)
    } catch {
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/contacts?id=${id}`, { method: 'DELETE' })
    } catch { /* ignore */ }
    setContacts(contacts.filter((c) => c.id !== id))
    setDeleteId(null)
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const typeTabs = ['', 'COMPRADOR', 'VENDEDOR', 'INQUILINO', 'PROPIETARIO']
  const typeLabels: Record<string, string> = {
    '': 'Todos',
    COMPRADOR: 'Compradores',
    VENDEDOR: 'Vendedores',
    INQUILINO: 'Inquilinos',
    PROPIETARIO: 'Propietarios',
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Contactos</h2>
          <p className="text-sm text-gray-500">{filtered.length} contactos</p>
        </div>
        <Button onClick={openCreate}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Contacto
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-48">
            <Input
              placeholder="Buscar contactos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>
          <div className="flex gap-1">
            {typeTabs.map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  filterType === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {typeLabels[t]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-semibold flex-shrink-0">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{contact.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-500">{contact.email || '-'}</TableCell>
                  <TableCell className="text-gray-500">{contact.phone || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={typeVariant[contact.type] || 'default'}>{contact.type}</Badge>
                  </TableCell>
                  <TableCell className="text-gray-500">{formatDate(contact.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(contact)} className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => setDeleteId(contact.id)} className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors">
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
                  <TableCell colSpan={6} className="text-center text-gray-400 py-8">No se encontraron contactos</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editContact ? 'Editar Contacto' : 'Nuevo Contacto'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Nombre completo"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="María García"
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="maria@email.com"
          />
          <Input
            label="Teléfono"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+54 11 4567-8901"
          />
          <Select
            label="Tipo"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            options={[
              { value: 'COMPRADOR', label: 'Comprador' },
              { value: 'VENDEDOR', label: 'Vendedor' },
              { value: 'INQUILINO', label: 'Inquilino' },
              { value: 'PROPIETARIO', label: 'Propietario' },
            ]}
          />
          <Textarea
            label="Notas"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Notas sobre el contacto..."
            rows={3}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}>
              {editContact ? 'Guardar cambios' : 'Crear contacto'}
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
        <p className="text-sm text-gray-600 mb-6">¿Estás seguro de que querés eliminar este contacto?</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button variant="danger" onClick={() => deleteId && handleDelete(deleteId)}>Eliminar</Button>
        </div>
      </Modal>
    </div>
  )
}

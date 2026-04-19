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

const typeVariant: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  COMPRADOR: 'info',
  VENDEDOR: 'success',
  INQUILINO: 'warning',
  PROPIETARIO: 'default',
}

const typeLabels: Record<string, string> = {
  COMPRADOR: 'Comprador',
  VENDEDOR: 'Vendedor',
  INQUILINO: 'Inquilino',
  PROPIETARIO: 'Propietario',
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
  const [detailContact, setDetailContact] = useState<Contact | null>(null)
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
        setContacts(data)
      }
    } catch { /* ignore */ }
    finally {
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
    setDetailContact(null)
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

  const openDetail = (c: Contact) => {
    setDetailContact(c)
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
    setDetailContact(null)
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const typeTabs = ['', 'COMPRADOR', 'VENDEDOR', 'INQUILINO', 'PROPIETARIO']
  const typeTabLabels: Record<string, string> = {
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
        <div className="flex flex-col gap-3">
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
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
            {typeTabs.map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                  filterType === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {typeTabLabels[t]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200">No se encontraron contactos</div>
        ) : (
          filtered.map((contact) => (
            <div
              key={contact.id}
              onClick={() => openDetail(contact)}
              className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm active:bg-gray-50 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-base font-semibold flex-shrink-0">
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{contact.name}</p>
                  <p className="text-sm text-gray-500 truncate">{contact.email || contact.phone || 'Sin datos de contacto'}</p>
                </div>
                <Badge variant={typeVariant[contact.type] || 'default'}>{typeLabels[contact.type] || contact.type}</Badge>
              </div>
              {contact.notes && (
                <p className="mt-2 text-sm text-gray-500 line-clamp-2">{contact.notes}</p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
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
                <TableRow key={contact.id} className="cursor-pointer hover:bg-gray-50" onClick={() => openDetail(contact)}>
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
                    <Badge variant={typeVariant[contact.type] || 'default'}>{typeLabels[contact.type] || contact.type}</Badge>
                  </TableCell>
                  <TableCell className="text-gray-500">{formatDate(contact.createdAt)}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
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

      {/* Detail Modal */}
      {detailContact && (
        <Modal
          open={!!detailContact}
          onClose={() => setDetailContact(null)}
          title={detailContact.name}
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-semibold flex-shrink-0">
                {detailContact.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{detailContact.name}</h3>
                <Badge variant={typeVariant[detailContact.type] || 'default'}>{typeLabels[detailContact.type] || detailContact.type}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {detailContact.email && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href={`mailto:${detailContact.email}`} className="text-sm text-blue-600 hover:underline truncate">{detailContact.email}</a>
                </div>
              )}
              {detailContact.phone && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a href={`tel:${detailContact.phone}`} className="text-sm text-blue-600 hover:underline">{detailContact.phone}</a>
                </div>
              )}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-gray-600">Creado: {formatDate(detailContact.createdAt)}</span>
              </div>
            </div>

            {detailContact.notes && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Notas</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{detailContact.notes}</p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="secondary" onClick={() => openEdit(detailContact)} className="flex-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar
              </Button>
              <Button variant="danger" onClick={() => { setDetailContact(null); setDeleteId(detailContact.id) }} className="flex-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Eliminar
              </Button>
            </div>
          </div>
        </Modal>
      )}

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

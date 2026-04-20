'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'

interface Contact {
  id: string
  name: string
  email?: string | null
  type: string
}

interface CampaignRecipient {
  id: string
  contactId: string
  contact: Contact
  emailId?: string | null
  sentAt?: string | null
  opened: boolean
  openedAt?: string | null
  clicked: boolean
  clickedAt?: string | null
  error?: string | null
}

interface Campaign {
  id: string
  title: string
  type: string
  subject?: string | null
  content?: string | null
  status: string
  sentAt?: string | null
  createdAt: string
  updatedAt: string
  recipients: CampaignRecipient[]
}

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'info'> = {
  BORRADOR: 'default',
  ENVIADA: 'success',
  PROGRAMADA: 'info',
}

const statusLabel: Record<string, string> = {
  BORRADOR: 'Borrador',
  ENVIADA: 'Enviada',
  PROGRAMADA: 'Programada',
}

const typeLabel: Record<string, string> = {
  NEWSLETTER: 'Newsletter',
  FLYER: 'Flyer',
}

const templates: Record<string, { subject: string; content: string }> = {
  newsletter_basic: {
    subject: 'Novedades del mercado inmobiliario',
    content: 'Estimado/a cliente,\n\nLe presentamos las últimas novedades del mercado inmobiliario...\n\nSaludos,\nEl equipo de Patagonia Desarrolla',
  },
  newsletter_properties: {
    subject: 'Propiedades destacadas del mes',
    content: 'Estimado/a cliente,\n\nEstas son las propiedades destacadas del mes:\n\n- Propiedad 1\n- Propiedad 2\n- Propiedad 3\n\nContáctenos para más información.',
  },
  flyer_promo: {
    subject: 'Oportunidades únicas en propiedades',
    content: 'OPORTUNIDADES ÚNICAS\n\nPropiedades en venta y alquiler a precios especiales.\nNo te pierdas estas ofertas exclusivas.',
  },
  flyer_new: {
    subject: 'Nuevas propiedades disponibles',
    content: 'NUEVAS PROPIEDADES\n\nAcabamos de incorporar estas propiedades a nuestro catálogo.\nVisítalas y encontrá tu próximo hogar.',
  },
}

const emptyForm = { title: '', type: 'NEWSLETTER', subject: '', content: '', template: '' }

export default function CampaniasPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)

  // Create/Edit modal
  const [createOpen, setCreateOpen] = useState(false)
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  // Detail/manage modal
  const [detailCampaign, setDetailCampaign] = useState<Campaign | null>(null)
  const [addingRecipients, setAddingRecipients] = useState(false)
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [contactSearch, setContactSearch] = useState('')
  const [sending, setSending] = useState(false)
  const [sendConfirmOpen, setSendConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    await Promise.all([fetchCampaigns(), fetchContacts()])
    setLoading(false)
  }

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns')
      if (res.ok) setCampaigns(await res.json())
    } catch { /* ignore */ }
  }

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/contacts')
      if (res.ok) setContacts(await res.json())
    } catch { /* ignore */ }
  }

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  const handleTemplateChange = (templateId: string) => {
    if (!templateId) { setForm({ ...form, template: '' }); return }
    const tpl = templates[templateId]
    if (tpl) setForm({ ...form, template: templateId, subject: tpl.subject, content: tpl.content })
  }

  const openCreate = () => {
    setEditCampaign(null)
    setForm(emptyForm)
    setCreateOpen(true)
  }

  const openEdit = (c: Campaign) => {
    setDetailCampaign(null)
    setEditCampaign(c)
    setForm({ title: c.title, type: c.type, subject: c.subject || '', content: c.content || '', template: '' })
    setCreateOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      if (editCampaign) {
        const res = await fetch(`/api/campaigns/${editCampaign.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: form.title, type: form.type, subject: form.subject, content: form.content }),
        })
        if (res.ok) {
          const updated = await res.json()
          setCampaigns(campaigns.map((c) => c.id === editCampaign.id ? updated : c))
          if (detailCampaign?.id === editCampaign.id) setDetailCampaign(updated)
          showToast('success', 'Campaña actualizada')
        }
      } else {
        const res = await fetch('/api/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: form.title, type: form.type, subject: form.subject, content: form.content }),
        })
        if (res.ok) {
          const created: Campaign = { ...(await res.json()), recipients: [] }
          setCampaigns([created, ...campaigns])
          showToast('success', 'Campaña creada')
        }
      }
      setCreateOpen(false)
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
      setCampaigns(campaigns.filter((c) => c.id !== id))
      setDeleteId(null)
      setDetailCampaign(null)
      showToast('success', 'Campaña eliminada')
    } catch { /* ignore */ }
  }

  const openDetail = async (c: Campaign) => {
    // Refresh recipients from server
    try {
      const res = await fetch(`/api/campaigns/${c.id}`)
      if (res.ok) {
        const fresh: Campaign = await res.json()
        setDetailCampaign(fresh)
        setCampaigns(campaigns.map((x) => x.id === c.id ? fresh : x))
        return
      }
    } catch { /* ignore */ }
    setDetailCampaign(c)
  }

  const handleAddRecipients = async () => {
    if (!detailCampaign || selectedContacts.size === 0) return
    setAddingRecipients(true)
    try {
      const res = await fetch(`/api/campaigns/${detailCampaign.id}/recipients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactIds: Array.from(selectedContacts) }),
      })
      if (res.ok) {
        const recipients: CampaignRecipient[] = await res.json()
        const updated = { ...detailCampaign, recipients }
        setDetailCampaign(updated)
        setCampaigns(campaigns.map((c) => c.id === detailCampaign.id ? updated : c))
        setSelectedContacts(new Set())
        setContactSearch('')
        showToast('success', `${selectedContacts.size} destinatario(s) agregado(s)`)
      }
    } catch { /* ignore */ }
    finally { setAddingRecipients(false) }
  }

  const handleRemoveRecipient = async (recipientId: string) => {
    if (!detailCampaign) return
    try {
      await fetch(`/api/campaigns/${detailCampaign.id}/recipients?recipientId=${recipientId}`, { method: 'DELETE' })
      const updated = {
        ...detailCampaign,
        recipients: detailCampaign.recipients.filter((r) => r.id !== recipientId),
      }
      setDetailCampaign(updated)
      setCampaigns(campaigns.map((c) => c.id === detailCampaign.id ? updated : c))
    } catch { /* ignore */ }
  }

  const handleSend = async () => {
    if (!detailCampaign) return
    setSending(true)
    setSendConfirmOpen(false)
    try {
      const res = await fetch(`/api/campaigns/${detailCampaign.id}/send`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        showToast('success', `Campaña enviada: ${data.sent} emails${data.errors > 0 ? `, ${data.errors} errores` : ''}`)
        // Refresh campaign
        const refreshed = await fetch(`/api/campaigns/${detailCampaign.id}`)
        if (refreshed.ok) {
          const fresh: Campaign = await refreshed.json()
          setDetailCampaign(fresh)
          setCampaigns(campaigns.map((c) => c.id === detailCampaign.id ? fresh : c))
        }
      } else {
        showToast('error', data.error || 'Error al enviar la campaña')
      }
    } catch {
      showToast('error', 'Error al enviar la campaña')
    } finally {
      setSending(false)
    }
  }

  const getMetrics = (c: Campaign) => {
    const total = c.recipients.length
    const sent = c.recipients.filter((r) => r.sentAt).length
    const opened = c.recipients.filter((r) => r.opened).length
    const clicked = c.recipients.filter((r) => r.clicked).length
    const base = sent || 1
    return {
      total,
      sent,
      opened,
      clicked,
      openRate: sent > 0 ? Math.round((opened / sent) * 100) : 0,
      clickRate: sent > 0 ? Math.round((clicked / sent) * 100) : 0,
    }
  }

  const formatDate = (d?: string | null) => {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const contactsNotYetAdded = contacts.filter(
    (c) => c.email && !detailCampaign?.recipients.some((r) => r.contactId === c.id)
  )
  const filteredContacts = contactsNotYetAdded.filter((c) =>
    !contactSearch || c.name.toLowerCase().includes(contactSearch.toLowerCase()) || (c.email || '').toLowerCase().includes(contactSearch.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Campañas</h2>
          <p className="text-sm text-gray-500">{campaigns.length} campañas</p>
        </div>
        <Button onClick={openCreate}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva campaña
        </Button>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          No hay campañas aún. ¡Creá la primera!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {campaigns.map((c) => {
            const m = getMetrics(c)
            return (
              <div
                key={c.id}
                onClick={() => openDetail(c)}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md cursor-pointer transition-shadow"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{c.title}</p>
                    {c.subject && <p className="text-xs text-gray-500 mt-0.5 truncate">{c.subject}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <Badge variant={statusVariant[c.status] || 'default'}>{statusLabel[c.status] || c.status}</Badge>
                    <span className="text-xs text-gray-400">{typeLabel[c.type] || c.type}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-gray-100 my-3">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{m.sent}</p>
                    <p className="text-xs text-gray-400">Enviados</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-lg font-bold ${m.openRate > 0 ? 'text-blue-600' : 'text-gray-300'}`}>
                      {m.sent > 0 ? `${m.openRate}%` : '-'}
                    </p>
                    <p className="text-xs text-gray-400">Abiertos</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-lg font-bold ${m.clickRate > 0 ? 'text-green-600' : 'text-gray-300'}`}>
                      {m.sent > 0 ? `${m.clickRate}%` : '-'}
                    </p>
                    <p className="text-xs text-gray-400">Clics</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{m.total} destinatario{m.total !== 1 ? 's' : ''}</span>
                  <span>{c.status === 'ENVIADA' ? `Enviada ${formatDate(c.sentAt)}` : `Creada ${formatDate(c.createdAt)}`}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={editCampaign ? 'Editar campaña' : 'Nueva campaña'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Título"
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
                { value: 'newsletter_basic', label: 'Newsletter básico' },
                { value: 'newsletter_properties', label: 'Propiedades destacadas' },
                { value: 'flyer_promo', label: 'Flyer promocional' },
                { value: 'flyer_new', label: 'Nuevas propiedades' },
              ]}
            />
          </div>
          <Input
            label="Asunto del email"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="Novedades - Abril 2025"
          />
          <Textarea
            label="Contenido"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Redactá el contenido de la campaña..."
            rows={7}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}>
              {editCampaign ? 'Guardar cambios' : 'Crear campaña'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      {detailCampaign && (
        <Modal
          open={!!detailCampaign}
          onClose={() => setDetailCampaign(null)}
          title={detailCampaign.title}
          size="2xl"
        >
          <div className="space-y-5">
            {/* Status + actions */}
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={statusVariant[detailCampaign.status] || 'default'}>{statusLabel[detailCampaign.status]}</Badge>
              <span className="text-sm text-gray-500">{typeLabel[detailCampaign.type]}</span>
              {detailCampaign.subject && <span className="text-sm text-gray-500 truncate">· {detailCampaign.subject}</span>}
              <div className="ml-auto flex gap-2">
                {detailCampaign.status !== 'ENVIADA' && (
                  <Button variant="secondary" onClick={() => openEdit(detailCampaign)}>
                    Editar
                  </Button>
                )}
                {detailCampaign.status !== 'ENVIADA' && detailCampaign.recipients.length > 0 && (
                  <Button onClick={() => setSendConfirmOpen(true)} loading={sending}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Enviar campaña
                  </Button>
                )}
                <button
                  onClick={() => { setDetailCampaign(null); setDeleteId(detailCampaign.id) }}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Metrics (if sent) */}
            {detailCampaign.status === 'ENVIADA' && (() => {
              const m = getMetrics(detailCampaign)
              return (
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Destinatarios', value: m.total, color: 'text-gray-900' },
                    { label: 'Enviados', value: m.sent, color: 'text-gray-900' },
                    { label: 'Abiertos', value: `${m.opened} (${m.openRate}%)`, color: 'text-blue-600' },
                    { label: 'Clics', value: `${m.clicked} (${m.clickRate}%)`, color: 'text-green-600' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>
              )
            })()}

            {/* Content preview */}
            {detailCampaign.content && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Contenido</p>
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap max-h-36 overflow-y-auto">
                  {detailCampaign.content}
                </div>
              </div>
            )}

            {/* Recipients */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Destinatarios ({detailCampaign.recipients.length})
                </p>
              </div>

              {/* Add recipients (only if not sent) */}
              {detailCampaign.status !== 'ENVIADA' && contactsNotYetAdded.length > 0 && (
                <div className="mb-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-xs font-medium text-blue-700 mb-2">Agregar destinatarios</p>
                  <Input
                    placeholder="Buscar contacto..."
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                  />
                  <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                    {filteredContacts.slice(0, 20).map((c) => (
                      <label key={c.id} className="flex items-center gap-2 p-2 hover:bg-white rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedContacts.has(c.id)}
                          onChange={(e) => {
                            const next = new Set(selectedContacts)
                            e.target.checked ? next.add(c.id) : next.delete(c.id)
                            setSelectedContacts(next)
                          }}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-900 flex-1 truncate">{c.name}</span>
                        <span className="text-xs text-gray-400 truncate">{c.email}</span>
                      </label>
                    ))}
                    {filteredContacts.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-2">Sin resultados</p>
                    )}
                  </div>
                  {selectedContacts.size > 0 && (
                    <div className="mt-2 flex justify-end">
                      <Button onClick={handleAddRecipients} loading={addingRecipients}>
                        Agregar {selectedContacts.size} contacto{selectedContacts.size !== 1 ? 's' : ''}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {detailCampaign.recipients.length === 0 ? (
                <p className="text-sm text-gray-400 py-3 text-center">Sin destinatarios. Agregá contactos arriba.</p>
              ) : (
                <div className="max-h-52 overflow-y-auto space-y-1">
                  {detailCampaign.recipients.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                      <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-semibold flex-shrink-0">
                        {r.contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{r.contact.name}</p>
                        <p className="text-xs text-gray-400 truncate">{r.contact.email}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {r.sentAt && (
                          <div className="flex gap-1">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${r.opened ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-300'}`} title={r.opened ? 'Abrió el email' : 'No abrió'}>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </span>
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${r.clicked ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-300'}`} title={r.clicked ? 'Hizo clic' : 'Sin clics'}>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                              </svg>
                            </span>
                          </div>
                        )}
                        {r.error && (
                          <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full" title={r.error}>Error</span>
                        )}
                        {!r.sentAt && detailCampaign.status !== 'ENVIADA' && (
                          <button
                            onClick={() => handleRemoveRecipient(r.id)}
                            className="p-1 text-gray-300 hover:text-red-500 rounded transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Send Confirm Modal */}
      <Modal open={sendConfirmOpen} onClose={() => setSendConfirmOpen(false)} title="Confirmar envío" size="sm">
        <p className="text-sm text-gray-600 mb-2">
          Estás por enviar <strong>{detailCampaign?.title}</strong> a{' '}
          <strong>{detailCampaign?.recipients.filter((r) => r.contact.email).length} destinatarios</strong>.
        </p>
        <p className="text-sm text-gray-500 mb-6">Esta acción no se puede deshacer.</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setSendConfirmOpen(false)}>Cancelar</Button>
          <Button onClick={handleSend} loading={sending}>Enviar ahora</Button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Eliminar campaña" size="sm">
        <p className="text-sm text-gray-600 mb-6">¿Estás seguro de que querés eliminar esta campaña?</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button variant="danger" onClick={() => deleteId && handleDelete(deleteId)}>Eliminar</Button>
        </div>
      </Modal>
    </div>
  )
}

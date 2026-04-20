'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'

interface WaTemplate {
  id: string
  name: string
  message: string
  formName?: string | null
}

const emptyForm = { name: '', message: '', formName: '' }

export default function PlantillasWaPage() {
  const [templates, setTemplates] = useState<WaTemplate[]>([])
  const [formNames, setFormNames] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTemplate, setEditTemplate] = useState<WaTemplate | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    await Promise.all([fetchTemplates(), fetchFormNames()])
    setLoading(false)
  }

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/wa-templates')
      if (res.ok) setTemplates(await res.json())
    } catch { /* ignore */ }
  }

  const fetchFormNames = async () => {
    try {
      const res = await fetch('/api/inquiries')
      if (res.ok) {
        const data: { adName?: string | null }[] = await res.json()
        const names = Array.from(new Set(data.map(i => i.adName).filter(Boolean))) as string[]
        setFormNames(names)
      }
    } catch { /* ignore */ }
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const openCreate = () => {
    setEditTemplate(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (t: WaTemplate) => {
    setEditTemplate(t)
    setForm({ name: t.name, message: t.message, formName: t.formName || '' })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.message.trim()) return
    setSaving(true)
    try {
      const payload = { name: form.name, message: form.message, formName: form.formName || null }
      if (editTemplate) {
        const res = await fetch(`/api/wa-templates?id=${editTemplate.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const updated = await res.json()
          setTemplates(templates.map(t => t.id === editTemplate.id ? updated : t))
          showToast('Plantilla actualizada')
        }
      } else {
        const res = await fetch('/api/wa-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const created = await res.json()
          setTemplates([...templates, created])
          showToast('Plantilla creada')
        }
      }
      setModalOpen(false)
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/wa-templates?id=${id}`, { method: 'DELETE' })
      setTemplates(templates.filter(t => t.id !== id))
      showToast('Plantilla eliminada')
    } catch { /* ignore */ }
    setDeleteId(null)
  }

  // Group: templates with formName, then without
  const withForm = templates.filter(t => t.formName)
  const withoutForm = templates.filter(t => !t.formName)

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white bg-green-500">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Plantillas de WhatsApp</h2>
          <p className="text-sm text-gray-500">
            Usá <strong>{'{nombre}'}</strong> en el mensaje para insertar el nombre del lead automáticamente
          </p>
        </div>
        <Button onClick={openCreate}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva plantilla
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center space-y-2">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No hay plantillas todavía</p>
          <p className="text-gray-400 text-xs">Creá tu primera plantilla para enviar WhatsApp rápido desde las consultas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Templates with associated form */}
          {withForm.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Con formulario asociado</p>
              <div className="space-y-3">
                {withForm.map(t => (
                  <TemplateCard key={t.id} template={t} onEdit={openEdit} onDelete={() => setDeleteId(t.id)} />
                ))}
              </div>
            </div>
          )}

          {/* Templates without form */}
          {withoutForm.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Sin formulario asociado</p>
              <div className="space-y-3">
                {withoutForm.map(t => (
                  <TemplateCard key={t.id} template={t} onEdit={openEdit} onDelete={() => setDeleteId(t.id)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTemplate ? 'Editar plantilla' : 'Nueva plantilla'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Nombre de la plantilla"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Ej: Casa Palermo, Depto Belgrano..."
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Formulario asociado{' '}
              <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <select
              value={form.formName}
              onChange={e => setForm({ ...form, formName: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sin asociar (uso manual)</option>
              {formNames.map(fn => (
                <option key={fn} value={fn}>{fn}</option>
              ))}
            </select>
            {form.formName && (
              <p className="text-xs text-green-600 mt-1">
                ✓ El ícono WA aparecerá automáticamente en las consultas del formulario "{form.formName}"
              </p>
            )}
            {!form.formName && (
              <p className="text-xs text-gray-400 mt-1">
                Sin asociar, la plantilla estará disponible para selección manual dentro del modal de consulta
              </p>
            )}
          </div>

          <Textarea
            label="Mensaje"
            value={form.message}
            onChange={e => setForm({ ...form, message: e.target.value })}
            placeholder={`Hola {nombre}, te contactamos desde Patagonia Desarrolla por la propiedad que consultaste...`}
            rows={5}
          />

          {form.message && (
            <div className="bg-green-50 border border-green-100 rounded-lg p-3">
              <p className="text-xs font-medium text-green-700 mb-1">Vista previa</p>
              <p className="text-sm text-green-800 whitespace-pre-wrap">
                {form.message.replace(/\{nombre\}/gi, 'Juan')}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}>
              {editTemplate ? 'Guardar cambios' : 'Crear plantilla'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Eliminar plantilla" size="sm">
        <p className="text-sm text-gray-600 mb-6">¿Estás seguro de que querés eliminar esta plantilla?</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button variant="danger" onClick={() => deleteId && handleDelete(deleteId)}>Eliminar</Button>
        </div>
      </Modal>
    </div>
  )
}

function TemplateCard({
  template,
  onEdit,
  onDelete,
}: {
  template: WaTemplate
  onEdit: (t: WaTemplate) => void
  onDelete: () => void
}) {
  const preview = template.message.replace(/\{nombre\}/gi, 'Juan')

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900">{template.name}</p>
            {template.formName && (
              <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full mt-0.5">
                {template.formName}
              </span>
            )}
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{preview}</p>
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(template)}
            className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

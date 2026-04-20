'use client'

import React, { useState, useEffect, useCallback } from 'react'

interface Agent {
  id: string
  name: string
  email: string
  role: string
}

interface AssignmentRule {
  id: string
  formName: string
  userId: string
  user: { id: string; name: string; email: string }
  createdAt: string
}

export default function ConfiguracionPage() {
  const [rules, setRules] = useState<AssignmentRule[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [formNames, setFormNames] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [customFormName, setCustomFormName] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [userId, setUserId] = useState('')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [rulesRes, agentsRes, inquiriesRes] = await Promise.all([
        fetch('/api/assignment-rules'),
        fetch('/api/users'),
        fetch('/api/inquiries'),
      ])
      if (rulesRes.ok) setRules(await rulesRes.json())
      if (agentsRes.ok) {
        const all: Agent[] = await agentsRes.json()
        setAgents(all.filter(u => u.role === 'AGENT' || u.role === 'ADMIN'))
      }
      if (inquiriesRes.ok) {
        const inqs: { adName?: string | null }[] = await inquiriesRes.json()
        const names = [...new Set(inqs.map(i => i.adName).filter(Boolean))] as string[]
        setFormNames(names)
      }
    } catch {
      setError('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const resetForm = () => {
    setEditId(null)
    setFormName('')
    setCustomFormName('')
    setUseCustom(false)
    setUserId('')
    setError(null)
  }

  const openAdd = () => {
    resetForm()
    setShowForm(true)
  }

  const openEdit = (rule: AssignmentRule) => {
    setEditId(rule.id)
    const isKnown = formNames.includes(rule.formName)
    setUseCustom(!isKnown)
    setFormName(isKnown ? rule.formName : '')
    setCustomFormName(isKnown ? '' : rule.formName)
    setUserId(rule.userId)
    setShowForm(true)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalFormName = useCustom ? customFormName.trim() : formName
    if (!finalFormName || !userId) {
      setError('Completá todos los campos')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const url = editId ? `/api/assignment-rules?id=${editId}` : '/api/assignment-rules'
      const method = editId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formName: finalFormName, userId }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Error al guardar')
        return
      }
      setShowForm(false)
      resetForm()
      fetchAll()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta regla?')) return
    await fetch(`/api/assignment-rules?id=${id}`, { method: 'DELETE' })
    fetchAll()
  }

  const usedFormNames = rules.map(r => r.formName).filter(f => f !== (editId ? rules.find(r => r.id === editId)?.formName : null))
  const availableFormNames = formNames.filter(f => !usedFormNames.includes(f))

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Asignación automática</h2>
        <p className="text-sm text-gray-500 mt-1">
          Cuando llega una consulta de un formulario específico, se asigna automáticamente al agente configurado.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
            {rules.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-gray-400">
                No hay reglas configuradas. Agregá una para empezar.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Formulario / Fuente</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Agente asignado</th>
                    <th className="px-4 py-3 w-24" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rules.map(rule => (
                    <tr key={rule.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{rule.formName}</td>
                      <td className="px-4 py-3 text-gray-600">
                        <span className="font-medium text-gray-800">{rule.user.name}</span>
                        <span className="block text-xs text-gray-400">{rule.user.email}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => openEdit(rule)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(rule.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!showForm && (
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva regla
            </button>
          )}

          {showForm && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                {editId ? 'Editar regla' : 'Nueva regla de asignación'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Formulario / Fuente</label>
                  {!useCustom ? (
                    <div className="flex gap-2">
                      <select
                        value={formName}
                        onChange={e => setFormName(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="">Seleccioná un formulario...</option>
                        {availableFormNames.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setUseCustom(true)}
                        className="px-3 py-2 text-xs text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap"
                      >
                        Escribir nombre
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customFormName}
                        onChange={e => setCustomFormName(e.target.value)}
                        placeholder="Nombre exacto del formulario"
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {formNames.length > 0 && (
                        <button
                          type="button"
                          onClick={() => { setUseCustom(false); setCustomFormName('') }}
                          className="px-3 py-2 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                        >
                          Ver lista
                        </button>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Debe coincidir exactamente con el campo &quot;formulario&quot; de la consulta.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Asignar a</label>
                  <select
                    value={userId}
                    onChange={e => setUserId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Seleccioná un agente...</option>
                    {agents.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
                    ))}
                  </select>
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                )}

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {saving ? 'Guardando...' : editId ? 'Guardar cambios' : 'Crear regla'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); resetForm() }}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  )
}

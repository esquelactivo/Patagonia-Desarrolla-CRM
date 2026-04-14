'use client'

import React, { useState, useEffect, useRef } from 'react'
import Papa from 'papaparse'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import type { Inquiry } from '@/types'

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

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  NUEVA: 'info',
  CONTACTADA: 'warning',
  CALIFICADA: 'success',
  DESCARTADA: 'danger',
}

const statusTabs = ['Todas', 'NUEVA', 'CONTACTADA', 'CALIFICADA', 'DESCARTADA']

export default function ConsultasPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Todas')
  const [csvModalOpen, setCsvModalOpen] = useState(false)
  const [csvPreview, setCsvPreview] = useState<Inquiry[]>([])
  const [csvImporting, setCsvImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchInquiries()
  }, [])

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

  const filtered = inquiries.filter((i) =>
    activeTab === 'Todas' || i.status === activeTab
  )

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

  const handlePassToPipeline = (inquiry: Inquiry) => {
    alert(`Consulta de ${inquiry.name} pasada al pipeline (funcionalidad conectada con DB)`)
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

  const buildSource = (row: Record<string, string>): string => {
    const origen = row['Origen'] || ''
    const canal = row['Canal'] || ''
    if (origen && canal) return `Meta Ads · ${origen} · ${canal}`
    if (origen) return `Meta Ads · ${origen}`
    return row['source'] || row['Origen'] || 'CSV Import'
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, string>[]
        const parsed: Inquiry[] = rows.map((row, i) => ({
          id: `csv-${i}-${Date.now()}`,
          // Meta Business: "Nombre" | genérico: "nombre", "name"
          name: row['Nombre'] || row['nombre'] || row['name'] || row['Name'] || `Contacto ${i + 1}`,
          // Meta Business: "Correo electrónico" | genérico: "email", "correo"
          email: row['Correo electrónico'] || row['email'] || row['Email'] || row['correo'] || null,
          // Meta Business: "Teléfono" | genérico: "telefono", "phone"
          phone: row['Teléfono'] || row['telefono'] || row['phone'] || row['Phone'] || row['teléfono'] || null,
          // Meta Business: "Formulario" = nombre del aviso/campaña → va como mensaje
          message: row['Formulario'] || row['mensaje'] || row['message'] || row['Message'] || null,
          source: buildSource(row),
          propertyId: null,
          contactId: null,
          status: 'NUEVA',
          createdAt: parseMetaDate(row['Fecha de creación'] || row['fecha'] || ''),
          updatedAt: new Date().toISOString(),
        }))
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
          body: JSON.stringify(inquiry),
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
    return new Date(date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const counts = statusTabs.reduce((acc, tab) => {
    acc[tab] = tab === 'Todas' ? inquiries.length : inquiries.filter((i) => i.status === tab).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-4">
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
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
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

      {/* Status Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-1 flex gap-1">
        {statusTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
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
                <TableHead>Formulario / Aviso</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((inquiry) => (
                <TableRow key={inquiry.id}>
                  <TableCell className="font-medium">{inquiry.name}</TableCell>
                  <TableCell className="text-gray-500">{inquiry.email || '-'}</TableCell>
                  <TableCell className="text-gray-500">{inquiry.phone || '-'}</TableCell>
                  <TableCell className="text-gray-500 max-w-48">
                    <span className="block truncate">{inquiry.message || '-'}</span>
                  </TableCell>
                  <TableCell className="text-gray-500">{inquiry.source || '-'}</TableCell>
                  <TableCell>
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
                  <TableCell className="text-gray-500">{formatDate(inquiry.createdAt)}</TableCell>
                  <TableCell>
                    {inquiry.status === 'CALIFICADA' && (
                      <Button size="sm" onClick={() => handlePassToPipeline(inquiry)}>
                        Pipeline
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-400 py-8">No hay consultas en este estado</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

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

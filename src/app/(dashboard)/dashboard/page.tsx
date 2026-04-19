import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function getDashboardData() {
  try {
    const [propiedades, contactos, consultasNuevas, dealsActivos, ultimasConsultas, dealsPorEtapa] =
      await Promise.all([
        prisma.property.count({ where: { status: 'DISPONIBLE' } }),
        prisma.contact.count(),
        prisma.inquiry.count({ where: { status: 'NUEVA' } }),
        prisma.deal.count({ where: { status: 'ACTIVA' } }),
        prisma.inquiry.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { property: true },
        }),
        prisma.deal.groupBy({
          by: ['stage'],
          _count: { stage: true },
          where: { status: 'ACTIVA' },
        }),
      ])

    return { propiedades, contactos, consultasNuevas, dealsActivos, ultimasConsultas, dealsPorEtapa }
  } catch {
    return {
      propiedades: 0,
      contactos: 0,
      consultasNuevas: 0,
      dealsActivos: 0,
      ultimasConsultas: [],
      dealsPorEtapa: [],
    }
  }
}

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  NUEVA: 'info',
  CONTACTADA: 'warning',
  CALIFICADA: 'success',
  DESCARTADA: 'danger',
}

const stageOrder = ['VISITA', 'OFERTA', 'RESERVA', 'CIERRE']

export default async function DashboardPage() {
  const data = await getDashboardData()

  const metrics = [
    {
      title: 'Propiedades Activas',
      value: data.propiedades,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Contactos',
      value: data.contactos,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Consultas Nuevas',
      value: data.consultasNuevas,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      title: 'Deals Activos',
      value: data.dealsActivos,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'bg-purple-100 text-purple-600',
    },
  ]

  const stageCountMap = Object.fromEntries(
    data.dealsPorEtapa.map((d) => [d.stage, d._count.stage])
  )

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.title}>
            <CardContent className="flex items-center gap-4 py-5">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${m.color}`}>
                {m.icon}
              </div>
              <div>
                <p className="text-sm text-gray-500">{m.title}</p>
                <p className="text-2xl font-bold text-gray-900">{m.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Últimas consultas */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Últimas Consultas</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {data.ultimasConsultas.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-400">
                  <p>No hay consultas aún</p>
                  <p className="text-xs mt-1">Las consultas aparecerán aquí cuando se registren</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Propiedad</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.ultimasConsultas.map((inq) => (
                      <TableRow key={inq.id}>
                        <TableCell className="font-medium">{inq.name}</TableCell>
                        <TableCell className="text-gray-500">{inq.email || '-'}</TableCell>
                        <TableCell className="text-gray-500">{inq.property?.title || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[inq.status] || 'default'}>
                            {inq.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pipeline */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stageOrder.map((stage) => {
                  const count = stageCountMap[stage] || 0
                  const colors: Record<string, string> = {
                    VISITA: 'bg-blue-500',
                    OFERTA: 'bg-yellow-500',
                    RESERVA: 'bg-orange-500',
                    CIERRE: 'bg-green-500',
                  }
                  return (
                    <div key={stage} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${colors[stage]}`} />
                        <span className="text-sm text-gray-700">{stage}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{count}</span>
                    </div>
                  )
                })}
                {data.dealsPorEtapa.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">Sin datos aún</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

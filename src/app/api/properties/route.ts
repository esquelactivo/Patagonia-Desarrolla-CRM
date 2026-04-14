import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const properties = await prisma.property.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(properties)
  } catch {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const property = await prisma.property.create({
      data: {
        title: body.title,
        description: body.description || null,
        type: body.type || 'CASA',
        operation: body.operation || 'VENTA',
        status: body.status || 'DISPONIBLE',
        price: parseFloat(body.price) || 0,
        currency: body.currency || 'USD',
        address: body.address || '',
        city: body.city || '',
        neighborhood: body.neighborhood || null,
        bedrooms: body.bedrooms ? parseInt(body.bedrooms) : null,
        bathrooms: body.bathrooms ? parseInt(body.bathrooms) : null,
        area: body.area ? parseFloat(body.area) : null,
        images: body.images || [],
        features: body.features || [],
        userId: 'demo-user-1',
      },
    })
    return NextResponse.json(property, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const body = await request.json()
    const property = await prisma.property.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description || null,
        type: body.type,
        operation: body.operation,
        status: body.status,
        price: parseFloat(body.price) || 0,
        currency: body.currency,
        address: body.address,
        city: body.city,
        neighborhood: body.neighborhood || null,
        bedrooms: body.bedrooms ? parseInt(body.bedrooms) : null,
        bathrooms: body.bathrooms ? parseInt(body.bathrooms) : null,
        area: body.area ? parseFloat(body.area) : null,
      },
    })
    return NextResponse.json(property)
  } catch {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await prisma.property.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

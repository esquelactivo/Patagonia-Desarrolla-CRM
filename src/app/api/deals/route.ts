import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const deals = await prisma.deal.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        contact: true,
        property: true,
      },
    })
    return NextResponse.json(deals)
  } catch {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const deal = await prisma.deal.create({
      data: {
        title: body.title,
        contactId: body.contactId || 'demo-contact',
        propertyId: body.propertyId || null,
        stage: body.stage || 'VISITA',
        status: body.status || 'ACTIVA',
        value: body.value ? parseFloat(body.value) : null,
        notes: body.notes || null,
      },
      include: {
        contact: true,
        property: true,
      },
    })
    return NextResponse.json(deal, { status: 201 })
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
    const updateData: Record<string, unknown> = {}
    if (body.stage !== undefined) updateData.stage = body.stage
    if (body.status !== undefined) updateData.status = body.status
    if (body.value !== undefined) updateData.value = body.value
    if (body.notes !== undefined) updateData.notes = body.notes

    const deal = await prisma.deal.update({
      where: { id },
      data: updateData,
      include: {
        contact: true,
        property: true,
      },
    })
    return NextResponse.json(deal)
  } catch {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

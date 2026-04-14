import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const contacts = await prisma.contact.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(contacts)
  } catch {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const contact = await prisma.contact.create({
      data: {
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        type: body.type || 'COMPRADOR',
        notes: body.notes || null,
      },
    })
    return NextResponse.json(contact, { status: 201 })
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
    const contact = await prisma.contact.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        type: body.type,
        notes: body.notes || null,
      },
    })
    return NextResponse.json(contact)
  } catch {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await prisma.contact.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/getUser'

export async function GET() {
  try {
    const user = await getUserFromRequest()
    const where = user && user.role === 'AGENT' ? { assignedTo: user.id } : {}

    const inquiries = await prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        property: true,
        contact: true,
        assignedUser: {
          select: { id: true, name: true, email: true },
        },
      },
    })
    return NextResponse.json(inquiries)
  } catch {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Cuando viene de Make, el message contiene todas las respuestas del formulario
    // como "nombre_campo: valor". Extraemos los campos estándar y dejamos solo las preguntas.
    const STANDARD_KEYS = ['full_name', 'email', 'phone', 'phone_number', 'city', 'zip', 'postal_code']

    const extractField = (text: string, keys: string[]): string | null => {
      for (const line of text.split('\n')) {
        const colon = line.indexOf(':')
        if (colon === -1) continue
        const key = line.slice(0, colon).trim().toLowerCase()
        if (keys.includes(key)) return line.slice(colon + 1).trim() || null
      }
      return null
    }

    const buildCustomMessage = (text: string): string | null => {
      const lines = text.split('\n').filter(line => {
        const colon = line.indexOf(':')
        if (colon === -1) return true
        const key = line.slice(0, colon).trim().toLowerCase()
        return !STANDARD_KEYS.includes(key)
      })
      return lines.join('\n').trim() || null
    }

    const rawMessage = body.message || ''
    const isFromMake = rawMessage.includes(':') && !body.name

    const name = body.name || extractField(rawMessage, ['full_name', 'nombre']) || 'Sin nombre'
    const email = body.email || extractField(rawMessage, ['email', 'correo'])
    const phone = body.phone || extractField(rawMessage, ['phone', 'phone_number', 'telefono', 'teléfono'])
    const message = isFromMake ? buildCustomMessage(rawMessage) : rawMessage || null

    const inquiry = await prisma.inquiry.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        message: message || null,
        source: body.source || null,
        channel: body.channel || null,
        adName: body.adName || null,
        formId: body.formId || null,
        propertyId: body.propertyId || null,
        contactId: body.contactId || null,
        status: body.status || 'NUEVA',
        assignedTo: body.assignedTo || null,
        ...(body.createdAt ? { createdAt: new Date(body.createdAt) } : {}),
      },
    })
    return NextResponse.json(inquiry, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await prisma.inquiry.delete({ where: { id } })
    return NextResponse.json({ ok: true })
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
    if (body.status !== undefined) updateData.status = body.status
    if (body.assignedTo !== undefined) updateData.assignedTo = body.assignedTo || null

    const inquiry = await prisma.inquiry.update({
      where: { id },
      data: updateData,
    })
    return NextResponse.json(inquiry)
  } catch {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

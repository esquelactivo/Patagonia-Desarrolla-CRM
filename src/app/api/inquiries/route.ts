import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const inquiries = await prisma.inquiry.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        property: true,
        contact: true,
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
    const inquiry = await prisma.inquiry.create({
      data: {
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        message: body.message || null,
        source: body.source || null,
        propertyId: body.propertyId || null,
        contactId: body.contactId || null,
        status: body.status || 'NUEVA',
      },
    })
    return NextResponse.json(inquiry, { status: 201 })
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
    const inquiry = await prisma.inquiry.update({
      where: { id },
      data: {
        status: body.status,
      },
    })
    return NextResponse.json(inquiry)
  } catch {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

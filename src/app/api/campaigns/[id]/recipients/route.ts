import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: campaignId } = await params
    const { contactIds } = await request.json()

    if (!Array.isArray(contactIds)) {
      return NextResponse.json({ error: 'contactIds must be an array' }, { status: 400 })
    }

    // Only add contacts that aren't already recipients
    const existing = await prisma.campaignRecipient.findMany({
      where: { campaignId },
      select: { contactId: true },
    })
    const existingIds = new Set(existing.map((r) => r.contactId))
    const toAdd = contactIds.filter((id: string) => !existingIds.has(id))

    if (toAdd.length > 0) {
      await prisma.campaignRecipient.createMany({
        data: toAdd.map((contactId: string) => ({ campaignId, contactId })),
      })
    }

    const recipients = await prisma.campaignRecipient.findMany({
      where: { campaignId },
      include: { contact: true },
    })
    return NextResponse.json(recipients)
  } catch {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: campaignId } = await params
    const { searchParams } = new URL(request.url)
    const recipientId = searchParams.get('recipientId')

    if (!recipientId) return NextResponse.json({ error: 'recipientId required' }, { status: 400 })

    await prisma.campaignRecipient.delete({ where: { id: recipientId } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

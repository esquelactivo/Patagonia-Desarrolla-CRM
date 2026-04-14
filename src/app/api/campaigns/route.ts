import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        recipients: true,
      },
    })
    return NextResponse.json(campaigns)
  } catch {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const campaign = await prisma.campaign.create({
      data: {
        title: body.title,
        type: body.type || 'NEWSLETTER',
        subject: body.subject || null,
        content: body.content || null,
        status: body.status || 'BORRADOR',
        sentAt: body.sentAt ? new Date(body.sentAt) : null,
      },
    })
    return NextResponse.json(campaign, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

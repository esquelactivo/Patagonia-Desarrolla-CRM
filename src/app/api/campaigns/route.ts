import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/getUser'

export async function GET() {
  try {
    const user = await getUserFromRequest()
    const where = user && user.role === 'AGENT' ? { userId: user.id } : {}

    const campaigns = await prisma.campaign.findMany({
      where,
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
    const user = await getUserFromRequest()
    const body = await request.json()
    const campaign = await prisma.campaign.create({
      data: {
        title: body.title,
        type: body.type || 'NEWSLETTER',
        subject: body.subject || null,
        content: body.content || null,
        status: body.status || 'BORRADOR',
        sentAt: body.sentAt ? new Date(body.sentAt) : null,
        userId: user?.id || null,
      },
    })
    return NextResponse.json(campaign, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

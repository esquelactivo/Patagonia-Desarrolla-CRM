import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

interface ResendWebhookEvent {
  type: string
  data: {
    email_id: string
    tags?: Record<string, string>
  }
}

export async function POST(request: Request) {
  try {
    const secret = process.env.RESEND_WEBHOOK_SECRET
    if (secret) {
      const token = request.headers.get('x-webhook-secret')
      if (token !== secret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const event: ResendWebhookEvent = await request.json()
    const emailId = event.data?.email_id

    if (!emailId) return NextResponse.json({ received: true })

    const recipient = await prisma.campaignRecipient.findFirst({
      where: { emailId },
    })

    if (!recipient) return NextResponse.json({ received: true })

    if (event.type === 'email.opened' && !recipient.opened) {
      await prisma.campaignRecipient.update({
        where: { id: recipient.id },
        data: { opened: true, openedAt: new Date() },
      })
    } else if (event.type === 'email.clicked' && !recipient.clicked) {
      await prisma.campaignRecipient.update({
        where: { id: recipient.id },
        data: { clicked: true, clickedAt: new Date() },
      })
    }

    return NextResponse.json({ received: true })
  } catch {
    return NextResponse.json({ error: 'Error procesando webhook' }, { status: 500 })
  }
}

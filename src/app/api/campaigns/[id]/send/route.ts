import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import prisma from '@/lib/prisma'

function buildEmailHtml(subject: string, content: string, fromName: string): string {
  const lines = content.split('\n').map((line) =>
    line.trim() === '' ? '<br/>' : `<p style="margin:0 0 12px 0;line-height:1.6;">${line}</p>`
  ).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#1e293b;padding:28px 40px;text-align:center;">
            <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">${fromName}</span>
          </td>
        </tr>
        <!-- Subject -->
        <tr>
          <td style="padding:32px 40px 0 40px;">
            <h1 style="margin:0 0 24px 0;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;">${subject}</h1>
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td style="padding:0 40px 32px 40px;color:#374151;font-size:15px;">
            ${lines}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              © ${new Date().getFullYear()} ${fromName}. Todos los derechos reservados.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: campaignId } = await params

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'RESEND_API_KEY no configurada' }, { status: 503 })
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        recipients: { include: { contact: true } },
      },
    })

    if (!campaign) return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 })
    if (campaign.status === 'ENVIADA') {
      return NextResponse.json({ error: 'La campaña ya fue enviada' }, { status: 400 })
    }

    const recipientsWithEmail = campaign.recipients.filter((r) => r.contact.email)
    if (recipientsWithEmail.length === 0) {
      return NextResponse.json({ error: 'Ningún destinatario tiene email' }, { status: 400 })
    }

    const resend = new Resend(apiKey)
    const fromName = process.env.RESEND_FROM_NAME || 'Patagonia Desarrolla'
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
    const subject = campaign.subject || campaign.title
    const content = campaign.content || ''
    const html = buildEmailHtml(subject, content, fromName)

    let sentCount = 0
    let errorCount = 0

    for (const recipient of recipientsWithEmail) {
      try {
        const { data, error } = await resend.emails.send({
          from: `${fromName} <${fromEmail}>`,
          to: [recipient.contact.email!],
          subject,
          html,
          tags: [
            { name: 'campaign_id', value: campaignId },
            { name: 'recipient_id', value: recipient.id },
          ],
        })

        if (error || !data) {
          await prisma.campaignRecipient.update({
            where: { id: recipient.id },
            data: { error: error?.message || 'Error desconocido' },
          })
          errorCount++
        } else {
          await prisma.campaignRecipient.update({
            where: { id: recipient.id },
            data: { emailId: data.id, sentAt: new Date(), error: null },
          })
          sentCount++
        }
      } catch (err) {
        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { error: String(err) },
        })
        errorCount++
      }
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'ENVIADA', sentAt: new Date() },
    })

    return NextResponse.json({ success: true, sent: sentCount, errors: errorCount })
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

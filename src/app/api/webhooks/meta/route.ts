import { NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import prisma from '@/lib/prisma'

const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'patagonia_crm_verify'
const APP_SECRET = process.env.META_APP_SECRET || ''
const GRAPH_API_VERSION = 'v19.0'
const PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN || ''

function verifySignature(body: string, signature: string): boolean {
  if (!APP_SECRET) return true // skip if not configured
  const expected = 'sha256=' + createHmac('sha256', APP_SECRET).update(body).digest('hex')
  return expected === signature
}

async function fetchLeadFromMeta(leadgenId: string): Promise<{
  name: string
  email: string | null
  phone: string | null
  adName: string | null
  formId: string | null
  rawFields: Record<string, string>
} | null> {
  if (!PAGE_ACCESS_TOKEN) return null

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${leadgenId}?fields=field_data,ad_name,form_id,created_time&access_token=${PAGE_ACCESS_TOKEN}`

  const res = await fetch(url)
  if (!res.ok) return null

  const data = await res.json()
  if (!data.field_data) return null

  const fields: Record<string, string> = {}
  for (const f of data.field_data) {
    fields[f.name] = Array.isArray(f.values) ? f.values[0] : f.values
  }

  const name =
    fields['full_name'] ||
    fields['nombre_completo'] ||
    fields['nombre'] ||
    [fields['first_name'], fields['last_name']].filter(Boolean).join(' ') ||
    'Sin nombre'

  return {
    name,
    email: fields['email'] || fields['correo_electronico'] || null,
    phone: fields['phone_number'] || fields['telefono'] || fields['celular'] || null,
    adName: data.ad_name || null,
    formId: data.form_id ? String(data.form_id) : null,
    rawFields: fields,
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 })
  }

  return new Response('Forbidden', { status: 403 })
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()

    const signature = request.headers.get('x-hub-signature-256') || ''
    if (!verifySignature(rawBody, signature)) {
      return new Response('Invalid signature', { status: 401 })
    }

    const body = JSON.parse(rawBody)

    if (body.object !== 'page') {
      return NextResponse.json({ received: true })
    }

    const entries: Array<{
      changes?: Array<{
        field: string
        value?: { leadgen_id?: string; page_id?: string; form_id?: string }
      }>
    }> = body.entry || []

    for (const entry of entries) {
      const changes = entry.changes || []
      for (const change of changes) {
        if (change.field !== 'leadgen') continue

        const leadgenId = change.value?.leadgen_id
        if (!leadgenId) continue

        try {
          const lead = await fetchLeadFromMeta(leadgenId)

          const message = lead
            ? Object.entries(lead.rawFields)
                .map(([k, v]) => `${k}: ${v}`)
                .join('\n')
            : `leadgen_id: ${leadgenId}`

          await prisma.inquiry.create({
            data: {
              name: lead?.name || 'Lead Meta',
              email: lead?.email || null,
              phone: lead?.phone || null,
              message,
              source: lead?.adName ? `Meta Ads: ${lead.adName}` : 'Meta Ads',
              status: 'SIN_CONTACTAR',
              adName: lead?.adName || null,
              formId: lead?.formId || null,
              channel: 'META',
            },
          })
        } catch {
          // log and continue processing other leads
          console.error('Error processing leadgen', leadgenId)
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

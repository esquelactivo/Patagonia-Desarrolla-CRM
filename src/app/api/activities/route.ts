import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/getUser'

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const done = searchParams.get('done')

    const where: Prisma.ActivityWhereInput = user && user.role === 'AGENT' ? { userId: user.id } : {}
    if (type) where.type = type
    if (done !== null) where.done = done === 'true'

    const activities = await prisma.activity.findMany({
      where,
      orderBy: { date: 'asc' },
      include: {
        contact: true,
        property: true,
        inquiry: { select: { id: true, name: true, adName: true } },
      },
    })
    return NextResponse.json(activities)
  } catch {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest()
    const body = await request.json()
    const data: Prisma.ActivityUncheckedCreateInput = {
      title: body.title,
      type: body.type || 'RECORDATORIO',
      date: body.date ? new Date(body.date) : new Date(),
      done: body.done || false,
      notes: body.notes || null,
      contactId: body.contactId || null,
      propertyId: body.propertyId || null,
      dealId: body.dealId || null,
      inquiryId: body.inquiryId || null,
      userId: user?.id || null,
    }
    const activity = await prisma.activity.create({
      data,
      include: {
        contact: true,
        inquiry: { select: { id: true, name: true, adName: true } },
      },
    })
    return NextResponse.json(activity, { status: 201 })
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
    if (body.done !== undefined) updateData.done = body.done
    if (body.title !== undefined) updateData.title = body.title
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.date !== undefined) updateData.date = new Date(body.date)
    if (body.type !== undefined) updateData.type = body.type
    if (body.contactId !== undefined) updateData.contactId = body.contactId || null
    if (body.inquiryId !== undefined) updateData.inquiryId = body.inquiryId || null

    const activity = await prisma.activity.update({
      where: { id },
      data: updateData,
      include: {
        contact: true,
        inquiry: { select: { id: true, name: true, adName: true } },
      },
    })
    return NextResponse.json(activity)
  } catch {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await prisma.activity.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

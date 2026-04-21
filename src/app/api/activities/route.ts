import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/getUser'

const participantsInclude = {
  include: { user: { select: { id: true, name: true } } },
}

const activityInclude = {
  contact: true,
  property: true,
  inquiry: { select: { id: true, name: true, adName: true } },
  user: { select: { id: true, name: true } },
  participants: participantsInclude,
}

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const done = searchParams.get('done')
    const participating = searchParams.get('participating')
    const notifiedParam = searchParams.get('notified')

    const where: Prisma.ActivityWhereInput = {}

    if (participating === 'true' && user) {
      where.participants = {
        some: {
          userId: user.id,
          ...(notifiedParam !== null ? { notified: notifiedParam === 'true' } : {}),
        },
      }
    } else if (user && user.role === 'AGENT') {
      where.OR = [
        { userId: user.id },
        { participants: { some: { userId: user.id } } },
      ]
    }

    if (type) where.type = type
    if (done !== null) where.done = done === 'true'

    const activities = await prisma.activity.findMany({
      where,
      orderBy: { date: 'asc' },
      include: activityInclude,
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
    const { participantIds, ...rest } = body

    const activity = await prisma.activity.create({
      data: {
        title: rest.title,
        type: rest.type || 'RECORDATORIO',
        date: rest.date ? new Date(rest.date) : new Date(),
        done: rest.done || false,
        notes: rest.notes || null,
        contactId: rest.contactId || null,
        propertyId: rest.propertyId || null,
        dealId: rest.dealId || null,
        inquiryId: rest.inquiryId || null,
        userId: user?.id || null,
        participants: participantIds?.length
          ? { create: (participantIds as string[]).map((uid) => ({ userId: uid })) }
          : undefined,
      },
      include: activityInclude,
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
    const { participantIds, ...rest } = body

    const updateData: Record<string, unknown> = {}
    if (rest.done !== undefined) updateData.done = rest.done
    if (rest.title !== undefined) updateData.title = rest.title
    if (rest.notes !== undefined) updateData.notes = rest.notes
    if (rest.date !== undefined) updateData.date = new Date(rest.date)
    if (rest.type !== undefined) updateData.type = rest.type
    if (rest.contactId !== undefined) updateData.contactId = rest.contactId || null
    if (rest.inquiryId !== undefined) updateData.inquiryId = rest.inquiryId || null

    if (participantIds !== undefined) {
      await prisma.activityParticipant.deleteMany({ where: { activityId: id } })
      if (participantIds.length > 0) {
        await prisma.activityParticipant.createMany({
          data: (participantIds as string[]).map((uid) => ({ activityId: id, userId: uid })),
          skipDuplicates: true,
        })
      }
    }

    const activity = await prisma.activity.update({
      where: { id },
      data: updateData,
      include: activityInclude,
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

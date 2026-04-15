import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/getUser'

export async function GET() {
  try {
    const user = await getUserFromRequest()
    const where = user && user.role === 'AGENT' ? { userId: user.id } : {}

    const activities = await prisma.activity.findMany({
      where,
      orderBy: { date: 'asc' },
      include: {
        contact: true,
        property: true,
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
      type: body.type || 'LLAMADA',
      date: body.date ? new Date(body.date) : new Date(),
      done: body.done || false,
      notes: body.notes || null,
      contactId: body.contactId || null,
      propertyId: body.propertyId || null,
      dealId: body.dealId || null,
      userId: user?.id || null,
    }
    const activity = await prisma.activity.create({ data })
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

    const activity = await prisma.activity.update({
      where: { id },
      data: updateData,
    })
    return NextResponse.json(activity)
  } catch {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/getUser'

export async function GET() {
  try {
    const user = await getUserFromRequest()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const rules = await prisma.assignmentRule.findMany({
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    })
    return NextResponse.json(rules)
  } catch {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { formName, userId } = await request.json()
    if (!formName || !userId) {
      return NextResponse.json({ error: 'formName and userId required' }, { status: 400 })
    }
    const rule = await prisma.assignmentRule.create({
      data: { formName, userId },
      include: { user: { select: { id: true, name: true, email: true } } },
    })
    return NextResponse.json(rule, { status: 201 })
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe una regla para ese formulario' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getUserFromRequest()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const { formName, userId } = await request.json()
    const rule = await prisma.assignmentRule.update({
      where: { id },
      data: {
        ...(formName !== undefined ? { formName } : {}),
        ...(userId !== undefined ? { userId } : {}),
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    })
    return NextResponse.json(rule)
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe una regla para ese formulario' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getUserFromRequest()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    await prisma.assignmentRule.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

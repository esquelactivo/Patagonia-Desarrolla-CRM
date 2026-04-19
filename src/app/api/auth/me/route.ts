import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/getUser'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const session = await getUserFromRequest()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true, email: true, name: true, role: true, avatar: true, createdAt: true },
    })
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getUserFromRequest()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json()
    const updateData: Record<string, unknown> = {}

    if (body.name) updateData.name = body.name
    if (body.email) updateData.email = body.email
    if (body.avatar !== undefined) updateData.avatar = body.avatar || null

    if (body.password && body.currentPassword) {
      const user = await prisma.user.findUnique({ where: { id: session.id } })
      if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
      const valid = await bcrypt.compare(body.currentPassword, user.password)
      if (!valid) return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 400 })
      updateData.password = await bcrypt.hash(body.password, 10)
    }

    const updated = await prisma.user.update({
      where: { id: session.id },
      data: updateData,
      select: { id: true, email: true, name: true, role: true, avatar: true, createdAt: true },
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

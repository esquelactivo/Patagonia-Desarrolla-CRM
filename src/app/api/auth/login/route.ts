import { NextResponse } from 'next/server'
import { signToken, checkDemoCredentials, DEMO_USER } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 })
    }

    // Try demo credentials first
    if (checkDemoCredentials(email, password)) {
      const token = signToken({
        id: DEMO_USER.id,
        email: DEMO_USER.email,
        name: DEMO_USER.name,
        role: DEMO_USER.role,
      })

      const response = NextResponse.json({ success: true, user: { id: DEMO_USER.id, email: DEMO_USER.email, name: DEMO_USER.name } })
      response.cookies.set('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })

      return response
    }

    // Try DB user
    try {
      const { default: prisma } = await import('@/lib/prisma')
      const bcrypt = await import('bcryptjs')

      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) {
        return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
      }

      const valid = await bcrypt.compare(password, user.password)
      if (!valid) {
        return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
      }

      const token = signToken({ id: user.id, email: user.email, name: user.name, role: user.role })
      const response = NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } })
      response.cookies.set('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      })

      return response
    } catch {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
    }
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

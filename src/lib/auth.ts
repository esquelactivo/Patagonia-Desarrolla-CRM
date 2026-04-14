import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'inmocrm-secret-key-2024'

export interface TokenPayload {
  id: string
  email: string
  name: string
  role: string
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload
    return decoded
  } catch {
    return null
  }
}

export const DEMO_USER = {
  id: 'demo-user-1',
  email: 'admin@inmobiliaria.com',
  name: 'Admin',
  role: 'ADMIN',
  password: 'admin123',
}

export function checkDemoCredentials(email: string, password: string): boolean {
  return email === DEMO_USER.email && password === DEMO_USER.password
}

import { cookies } from 'next/headers'
import { verifyToken } from './auth'

export async function getUserFromRequest() {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value
  if (!token) return null
  try {
    return verifyToken(token) as { id: string; email: string; name: string; role: string } | null
  } catch {
    return null
  }
}

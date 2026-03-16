import { NextRequest } from 'next/server'
import { redis } from './redis'

export interface SessionData {
  userId: string
  name: string
  avatar: string
}

export async function getSession(req: NextRequest): Promise<SessionData | null> {
  const sessionId = req.cookies.get('session')?.value
  if (!sessionId) return null
  const raw = await redis.get<string>(`session:${sessionId}`)
  if (!raw) return null
  return typeof raw === 'string' ? JSON.parse(raw) : raw
}

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get('session')?.value
  if (!sessionId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const raw = await redis.get<string>(`session:${sessionId}`)
  if (!raw) return NextResponse.json({ error: 'Session expired' }, { status: 401 })

  const session = typeof raw === 'string' ? JSON.parse(raw) : raw
  return NextResponse.json({ code: 0, data: session })
}

import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { getValidToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get('session')?.value
  if (!sessionId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const session = await redis.get<string>(`session:${sessionId}`)
  if (!session) return NextResponse.json({ error: 'Session expired' }, { status: 401 })

  const { userId } = JSON.parse(session)

  try {
    const token = await getValidToken(userId)
    return NextResponse.json({ code: 0, data: { valid: true, userId } })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 })
  }
}

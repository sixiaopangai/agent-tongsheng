export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { getValidToken } from '@/lib/auth'
import { extractIntent } from '@/lib/extractIntent'
import { createComplaint, getAllGroups } from '@/lib/matchingEngine'

async function getSession(req: NextRequest) {
  const sessionId = req.cookies.get('session')?.value
  if (!sessionId) return null
  const data = await redis.get<string>(`session:${sessionId}`)
  return data ? JSON.parse(data) : null
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { text } = await req.json()
  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'Missing complaint text' }, { status: 400 })
  }

  try {
    const token = await getValidToken(session.userId)
    const intent = await extractIntent(text, token)

    const complaint = await createComplaint({
      userId: session.userId,
      raw: text,
      brand: intent.brand,
      category: intent.category,
      timeline: intent.timeline,
      demand: intent.demand,
      severity: intent.severity,
      summary: intent.summary,
    })

    return NextResponse.json({ code: 0, data: complaint })
  } catch (err: any) {
    console.error('Complaint creation error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const groups = await getAllGroups()
    return NextResponse.json({ code: 0, data: groups })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

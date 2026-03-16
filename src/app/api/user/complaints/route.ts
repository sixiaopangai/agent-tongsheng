export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getUserComplaints } from '@/lib/matchingEngine'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  try {
    const complaints = await getUserComplaints(session.userId)
    return NextResponse.json({ code: 0, data: complaints })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

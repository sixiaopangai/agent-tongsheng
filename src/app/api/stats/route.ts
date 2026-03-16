export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getStats } from '@/lib/matchingEngine'

export async function GET() {
  try {
    const stats = await getStats()
    return NextResponse.json({ code: 0, data: stats })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

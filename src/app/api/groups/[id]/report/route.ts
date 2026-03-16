export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { generateCollectiveReport } from '@/lib/generateReport'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Check cached report
    const cached = await redis.get<string>(`group:report:${id}`)
    if (cached) return NextResponse.json({ code: 0, data: { report: cached } })

    // Generate new report
    const report = await generateCollectiveReport(id)
    return NextResponse.json({ code: 0, data: { report } })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

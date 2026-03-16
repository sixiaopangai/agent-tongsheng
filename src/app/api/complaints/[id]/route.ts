export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getComplaint } from '@/lib/matchingEngine'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const complaint = await getComplaint(params.id)
    if (!complaint) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    // Strip sensitive fields
    const { raw, ...safe } = complaint
    return NextResponse.json({ code: 0, data: { ...safe, raw } })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

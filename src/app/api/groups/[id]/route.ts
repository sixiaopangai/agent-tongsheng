export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getGroup, getGroupComplaints, getGroupTimeline } from '@/lib/matchingEngine'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const group = await getGroup(id)
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    const [complaints, timeline] = await Promise.all([
      getGroupComplaints(id),
      getGroupTimeline(id),
    ])

    return NextResponse.json({
      code: 0,
      data: {
        ...group,
        complaints: complaints.map((c) => ({
          id: c.id,
          summary: c.summary,
          severity: c.severity,
          demand: c.demand,
          createdAt: c.createdAt,
        })),
        timeline,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

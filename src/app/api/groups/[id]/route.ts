import { NextRequest, NextResponse } from 'next/server'
import { getGroup, getGroupComplaints } from '@/lib/matchingEngine'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const group = await getGroup(params.id)
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    const complaints = await getGroupComplaints(params.id)
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
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

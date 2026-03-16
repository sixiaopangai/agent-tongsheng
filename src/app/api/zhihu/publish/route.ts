export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { publishToCircle } from '@/lib/zhihu'

const CIRCLE_IDS = ['2001009660925334090', '2015023739549529606']

export async function POST(req: NextRequest) {
  const { content, ringId } = await req.json()
  if (!content) return NextResponse.json({ error: 'Missing content' }, { status: 400 })

  const targetRing = ringId || CIRCLE_IDS[0]

  try {
    const data = await publishToCircle(content, targetRing)
    return NextResponse.json({ code: 0, data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

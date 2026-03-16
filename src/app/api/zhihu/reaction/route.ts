export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { toggleReaction } from '@/lib/zhihu'

export async function POST(req: NextRequest) {
  const { targetId, targetType, action } = await req.json()
  if (!targetId || !targetType || !action) {
    return NextResponse.json({ error: 'Missing targetId, targetType or action' }, { status: 400 })
  }

  try {
    const data = await toggleReaction(targetId, targetType, action)
    return NextResponse.json({ code: 0, data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

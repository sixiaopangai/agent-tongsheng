export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getComments } from '@/lib/zhihu'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const targetId = url.searchParams.get('targetId')
  const targetType = url.searchParams.get('targetType')

  if (!targetId || !targetType) {
    return NextResponse.json({ error: 'Missing targetId or targetType' }, { status: 400 })
  }

  try {
    const data = await getComments(targetId, targetType)
    return NextResponse.json({ code: 0, data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

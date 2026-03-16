export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getCircleInfo, getCirclePins } from '@/lib/zhihu'

const DEFAULT_RING_ID = '2001009660925334090'

export async function GET(req: NextRequest) {
  const ringId = new URL(req.url).searchParams.get('ringId') || DEFAULT_RING_ID

  try {
    const [info, pins] = await Promise.allSettled([
      getCircleInfo(ringId),
      getCirclePins(ringId),
    ])
    return NextResponse.json({
      code: 0,
      data: {
        info: info.status === 'fulfilled' ? info.value : null,
        pins: pins.status === 'fulfilled' ? pins.value : null,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

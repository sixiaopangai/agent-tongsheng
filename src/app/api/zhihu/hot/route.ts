import { NextResponse } from 'next/server'
import { getHotTopics } from '@/lib/zhihu'

export async function GET() {
  try {
    const data = await getHotTopics()
    return NextResponse.json({ code: 0, data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { zhihuSearch } from '@/lib/zhihu'

export async function GET(req: NextRequest) {
  const keyword = new URL(req.url).searchParams.get('keyword')
  if (!keyword) return NextResponse.json({ error: 'Missing keyword' }, { status: 400 })

  try {
    const data = await zhihuSearch(keyword)
    return NextResponse.json({ code: 0, data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

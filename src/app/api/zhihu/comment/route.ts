export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createComment, deleteComment } from '@/lib/zhihu'

export async function POST(req: NextRequest) {
  const { targetId, targetType, content } = await req.json()
  if (!targetId || !targetType || !content) {
    return NextResponse.json({ error: 'Missing targetId, targetType or content' }, { status: 400 })
  }

  try {
    const data = await createComment(targetId, targetType, content)
    return NextResponse.json({ code: 0, data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { commentId } = await req.json()
  if (!commentId) {
    return NextResponse.json({ error: 'Missing commentId' }, { status: 400 })
  }

  try {
    const data = await deleteComment(commentId)
    return NextResponse.json({ code: 0, data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

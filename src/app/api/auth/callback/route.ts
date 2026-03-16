export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { exchangeCode, storeTokens, getUserInfo } from '@/lib/auth'
import { redis } from '@/lib/redis'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    const errorDesc = searchParams.get('error_description') || error
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(errorDesc)}`, process.env.NEXT_PUBLIC_APP_URL!))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', process.env.NEXT_PUBLIC_APP_URL!))
  }

  try {
    const tokens = await exchangeCode(code)
    const userInfo = await getUserInfo(tokens.accessToken)
    const userId = userInfo.userId

    await storeTokens(userId, tokens)

    // Store user info
    await redis.set(`user:info:${userId}`, JSON.stringify(userInfo), { ex: 30 * 86400 })

    // Track OAuth login count (for hackathon scoring)
    await redis.sadd('all:users', userId)

    // Create session
    const sessionId = crypto.randomUUID()
    await redis.set(`session:${sessionId}`, JSON.stringify({ userId, name: userInfo.name, avatar: userInfo.avatar }), { ex: 7200 })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://agent-tongsheng.vercel.app'
    const response = NextResponse.redirect(new URL('/', appUrl))
    response.cookies.set('session', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 7200,
      path: '/',
    })
    return response
  } catch (err: any) {
    console.error('OAuth callback error:', err)
    // Return visible error for debugging
    return NextResponse.json({
      error: 'auth_failed',
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    }, { status: 500 })
  }
}

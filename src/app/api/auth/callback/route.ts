export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { exchangeCode, storeTokens, getUserInfo } from '@/lib/auth'
import { redis } from '@/lib/redis'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${error}`, req.url))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', req.url))
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

    const response = NextResponse.redirect(new URL('/', req.url))
    response.cookies.set('session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7200,
    })
    return response
  } catch (err: any) {
    console.error('OAuth callback error:', err)
    return NextResponse.redirect(new URL(`/?error=auth_failed`, req.url))
  }
}

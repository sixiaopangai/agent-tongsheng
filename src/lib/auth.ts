import { redis } from './redis'
import { encrypt, decrypt } from './encrypt'

const SECONDME_BASE = 'https://api.mindverse.com/gate/lab'

interface TokenData {
  accessToken: string
  refreshToken: string
  expiresAt: number // unix ms
}

export function getAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.SECONDME_CLIENT_ID!,
    redirect_uri: process.env.SECONDME_REDIRECT_URI!,
    response_type: 'code',
    scope: 'user.info user.info.shades user.info.softmemory chat note.add voice',
    state,
  })
  return `https://go.second.me/oauth/?${params}`
}

export async function exchangeCode(code: string): Promise<TokenData> {
  const res = await fetch(`${SECONDME_BASE}/api/oauth/token/code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.SECONDME_REDIRECT_URI!,
      client_id: process.env.SECONDME_CLIENT_ID!,
      client_secret: process.env.SECONDME_CLIENT_SECRET!,
    }),
  })
  const json = await res.json()
  if (json.code !== 0) throw new Error(json.message || 'Token exchange failed')
  const { accessToken, refreshToken, expiresIn } = json.data
  return {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + expiresIn * 1000,
  }
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenData> {
  const res = await fetch(`${SECONDME_BASE}/api/oauth/token/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.SECONDME_CLIENT_ID!,
      client_secret: process.env.SECONDME_CLIENT_SECRET!,
    }),
  })
  const json = await res.json()
  if (json.code !== 0) throw new Error(json.message || 'Token refresh failed')
  const { accessToken, expiresIn } = json.data
  return {
    accessToken,
    refreshToken: json.data.refreshToken,
    expiresAt: Date.now() + expiresIn * 1000,
  }
}

export async function storeTokens(userId: string, tokens: TokenData) {
  await redis.hset(`user:tokens:${userId}`, {
    accessToken: encrypt(tokens.accessToken),
    refreshToken: encrypt(tokens.refreshToken),
    expiresAt: tokens.expiresAt.toString(),
  })
  await redis.expire(`user:tokens:${userId}`, 30 * 86400) // 30 days
}

export async function getValidToken(userId: string): Promise<string> {
  const data = await redis.hgetall<Record<string, string>>(`user:tokens:${userId}`)
  if (!data?.accessToken) throw new Error('No token found for user')

  const accessToken = decrypt(data.accessToken)
  const refreshToken = decrypt(data.refreshToken)
  const expiresAt = parseInt(data.expiresAt)

  // Refresh if expiring within 5 minutes
  if (Date.now() > expiresAt - 5 * 60 * 1000) {
    const newTokens = await refreshAccessToken(refreshToken)
    await storeTokens(userId, newTokens)
    return newTokens.accessToken
  }

  return accessToken
}

export async function getUserInfo(accessToken: string) {
  const res = await fetch(`${SECONDME_BASE}/api/secondme/user/info`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const json = await res.json()
  if (json.code !== 0) throw new Error(json.message || 'Failed to get user info')
  return json.data
}

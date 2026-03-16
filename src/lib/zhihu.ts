import crypto from 'crypto'
import { redis } from './redis'

const ZHIHU_BASE = 'https://openapi.zhihu.com'
const ZHIHU_APP_KEY = process.env.ZHIHU_APP_KEY!
const ZHIHU_APP_SECRET = process.env.ZHIHU_APP_SECRET!

function generateHeaders(method: string, path: string, body?: string) {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const logId = crypto.randomUUID()
  const signPayload = `${method.toUpperCase()}\n${path}\n${timestamp}\n${body || ''}`
  const sign = crypto.createHmac('sha256', ZHIHU_APP_SECRET).update(signPayload).digest('hex')
  return {
    'X-App-Key': ZHIHU_APP_KEY,
    'X-Timestamp': timestamp,
    'X-Log-Id': logId,
    'X-Sign': sign,
    'Content-Type': 'application/json',
  }
}

export async function getHotTopics(hours = 24) {
  const path = '/openapi/billboard/list'
  const url = `${ZHIHU_BASE}${path}?hours=${hours}`
  const res = await fetch(url, { headers: generateHeaders('GET', path) })
  return res.json()
}

export async function zhihuSearch(keyword: string) {
  const cacheKey = `zhihu:search:${keyword}`
  const cached = await redis.get<string>(cacheKey)
  if (cached) return JSON.parse(cached)

  const path = '/openapi/search/global'
  const url = `${ZHIHU_BASE}${path}?keyword=${encodeURIComponent(keyword)}`
  const res = await fetch(url, { headers: generateHeaders('GET', path) })
  const data = await res.json()
  await redis.set(cacheKey, JSON.stringify(data), { ex: 3600 })
  return data
}

export async function publishToCircle(content: string, ringId: string) {
  const path = '/openapi/publish/pin'
  const body = JSON.stringify({ content, ring_id: ringId })
  const res = await fetch(`${ZHIHU_BASE}${path}`, {
    method: 'POST',
    headers: generateHeaders('POST', path, body),
    body,
  })
  return res.json()
}

export async function createComment(targetId: string, targetType: string, content: string) {
  const path = '/openapi/comment/create'
  const body = JSON.stringify({ target_id: targetId, target_type: targetType, content })
  const res = await fetch(`${ZHIHU_BASE}${path}`, {
    method: 'POST',
    headers: generateHeaders('POST', path, body),
    body,
  })
  return res.json()
}

export async function toggleReaction(targetId: string, targetType: string, action: 'up' | 'cancel_up') {
  const path = '/openapi/reaction'
  const body = JSON.stringify({ target_id: targetId, target_type: targetType, action })
  const res = await fetch(`${ZHIHU_BASE}${path}`, {
    method: 'POST',
    headers: generateHeaders('POST', path, body),
    body,
  })
  return res.json()
}

export async function getCircleInfo(ringId: string) {
  const path = '/openapi/ring/detail'
  const url = `${ZHIHU_BASE}${path}?ring_id=${ringId}`
  const res = await fetch(url, { headers: generateHeaders('GET', path) })
  return res.json()
}

export async function getCirclePins(ringId: string) {
  const path = '/openapi/ring/pins'
  const url = `${ZHIHU_BASE}${path}?ring_id=${ringId}`
  const res = await fetch(url, { headers: generateHeaders('GET', path) })
  return res.json()
}

export async function deleteComment(commentId: string) {
  const path = '/openapi/comment/delete'
  const body = JSON.stringify({ comment_id: commentId })
  const res = await fetch(`${ZHIHU_BASE}${path}`, {
    method: 'POST',
    headers: generateHeaders('POST', path, body),
    body,
  })
  return res.json()
}

export async function getComments(targetId: string, targetType: string) {
  const path = '/openapi/comment/list'
  const url = `${ZHIHU_BASE}${path}?target_id=${targetId}&target_type=${targetType}`
  const res = await fetch(url, { headers: generateHeaders('GET', path) })
  return res.json()
}

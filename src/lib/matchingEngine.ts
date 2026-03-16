import { redis } from './redis'
import { getPusherServer } from './pusher'

export interface Complaint {
  id: string
  userId: string
  raw: string
  brand: string
  category: string
  timeline: string
  demand: string
  severity: number
  summary: string
  status: 'pending' | 'matching' | 'aggregated' | 'resolved'
  groupId: string | null
  createdAt: number
}

export interface MatchGroup {
  id: string
  brand: string
  category: string
  count: number
  threshold: number
  reportUrl: string | null
  status: 'forming' | 'ready' | 'reported'
  createdAt: number
  updatedAt: number
}

const DEFAULT_THRESHOLD = 10

// Upstash REST client may return parsed objects or strings
function safeParse<T>(data: any): T | null {
  if (!data) return null
  if (typeof data === 'object') return data as T
  try { return JSON.parse(data) as T } catch { return null }
}

function isSimilarCategory(a: string, b: string): boolean {
  if (a === b) return true
  const similar: Record<string, string[]> = {
    '质量问题': ['售后问题'],
    '售后问题': ['质量问题'],
    '虚假宣传': ['其他'],
  }
  return similar[a]?.includes(b) ?? false
}

export async function createComplaint(data: Omit<Complaint, 'id' | 'status' | 'groupId' | 'createdAt'>): Promise<Complaint> {
  const complaint: Complaint = {
    ...data,
    id: crypto.randomUUID(),
    status: 'matching',
    groupId: null,
    createdAt: Date.now(),
  }
  await redis.set(`complaint:${complaint.id}`, JSON.stringify(complaint), { ex: 30 * 86400 })
  await redis.sadd(`user:complaints:${complaint.userId}`, complaint.id)

  const groupId = await findOrCreateGroup(complaint)
  complaint.groupId = groupId
  complaint.status = 'matching'
  await redis.set(`complaint:${complaint.id}`, JSON.stringify(complaint), { ex: 30 * 86400 })

  return complaint
}

export async function findOrCreateGroup(complaint: Complaint): Promise<string> {
  const exactKey = `group:index:${complaint.brand}:${complaint.category}`
  const existingGroup = await redis.get<string>(exactKey)
  if (existingGroup) {
    await joinGroup(existingGroup, complaint)
    return existingGroup
  }

  const brandGroups = await redis.smembers(`brand:groups:${complaint.brand}`)
  for (const groupId of brandGroups) {
    const group = safeParse<MatchGroup>(await redis.get(`group:${groupId}`))
    if (group && isSimilarCategory(complaint.category, group.category)) {
      await joinGroup(groupId, complaint)
      return groupId
    }
  }

  return await createGroup(complaint)
}

async function createGroup(complaint: Complaint): Promise<string> {
  const groupId = crypto.randomUUID()
  const group: MatchGroup = {
    id: groupId,
    brand: complaint.brand,
    category: complaint.category,
    count: 1,
    threshold: complaint.severity >= 4 ? 5 : DEFAULT_THRESHOLD,
    reportUrl: null,
    status: 'forming',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  const pipe = redis.pipeline()
  pipe.set(`group:${groupId}`, JSON.stringify(group), { ex: 30 * 86400 })
  pipe.set(`group:index:${complaint.brand}:${complaint.category}`, groupId, { ex: 30 * 86400 })
  pipe.sadd(`brand:groups:${complaint.brand}`, groupId)
  pipe.sadd(`group:complaints:${groupId}`, complaint.id)
  pipe.set(`complaint:group:${complaint.id}`, groupId)
  pipe.sadd('all:groups', groupId)
  await pipe.exec()

  return groupId
}

async function joinGroup(groupId: string, complaint: Complaint) {
  const pipe = redis.pipeline()
  pipe.sadd(`group:complaints:${groupId}`, complaint.id)
  pipe.set(`complaint:group:${complaint.id}`, groupId)
  await pipe.exec()

  const memberIds = await redis.smembers(`group:complaints:${groupId}`)
  const count = memberIds.length
  const group = safeParse<MatchGroup>(await redis.get(`group:${groupId}`))
  if (group) {
    group.count = count
    group.updatedAt = Date.now()
    if (count >= group.threshold && group.status === 'forming') {
      group.status = 'ready'
    }
    await redis.set(`group:${groupId}`, JSON.stringify(group), { ex: 30 * 86400 })
  }

  if (process.env.NEXT_PUBLIC_PUSHER_KEY && process.env.PUSHER_SECRET) {
    try {
      const pusher = getPusherServer()
      await pusher.trigger(`group-${groupId}`, 'member-joined', {
        count,
        summary: complaint.summary,
      })
    } catch {}
  }
}

export async function getComplaint(id: string): Promise<Complaint | null> {
  return safeParse<Complaint>(await redis.get(`complaint:${id}`))
}

export async function getGroup(id: string): Promise<MatchGroup | null> {
  return safeParse<MatchGroup>(await redis.get(`group:${id}`))
}

export async function getGroupComplaints(groupId: string): Promise<Complaint[]> {
  const ids = await redis.smembers(`group:complaints:${groupId}`)
  const complaints: Complaint[] = []
  for (const id of ids) {
    const c = await getComplaint(id)
    if (c) complaints.push(c)
  }
  return complaints
}

export async function getAllGroups(): Promise<MatchGroup[]> {
  const ids = await redis.smembers('all:groups')
  const groups: MatchGroup[] = []
  for (const id of ids) {
    const g = await getGroup(id)
    if (g) groups.push(g)
  }
  return groups.sort((a, b) => b.count - a.count)
}

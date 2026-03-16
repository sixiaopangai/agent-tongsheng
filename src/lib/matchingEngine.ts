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

export interface TimelineEvent {
  type: 'group_created' | 'member_joined' | 'threshold_reached' | 'report_generated'
  message: string
  timestamp: number
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
  await incrementStats(complaint.userId)

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

  await addTimelineEvent(groupId, {
    type: 'group_created',
    message: `聚合组创建：${complaint.brand} - ${complaint.category}`,
    timestamp: Date.now(),
  })

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

    await addTimelineEvent(groupId, {
      type: 'member_joined',
      message: `第 ${count} 位同命人加入`,
      timestamp: Date.now(),
    })

    if (count >= (group.threshold) && group.status === 'ready') {
      await addTimelineEvent(groupId, {
        type: 'threshold_reached',
        message: `已达到 ${group.threshold} 人阈值，可以生成集体报告`,
        timestamp: Date.now(),
      })
    }
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

// --- Timeline ---

export async function addTimelineEvent(groupId: string, event: TimelineEvent) {
  await redis.rpush(`group:timeline:${groupId}`, JSON.stringify(event))
  await redis.expire(`group:timeline:${groupId}`, 30 * 86400)
}

export async function getGroupTimeline(groupId: string): Promise<TimelineEvent[]> {
  const raw = await redis.lrange(`group:timeline:${groupId}`, 0, -1)
  return raw.map((r: any) => (typeof r === 'string' ? JSON.parse(r) : r))
}

// --- Stats ---

export async function getStats() {
  const [userCount, complaintCount, groupIds] = await Promise.all([
    redis.scard('all:users'),
    redis.get<number>('stat:complaints'),
    redis.smembers('all:groups'),
  ])
  return {
    users: Number(userCount) || 0,
    complaints: Number(complaintCount) || 0,
    groups: groupIds.length,
  }
}

export async function incrementStats(userId: string) {
  const pipe = redis.pipeline()
  pipe.sadd('all:users', userId)
  pipe.incr('stat:complaints')
  await pipe.exec()
}

// --- User complaints ---

export async function getUserComplaints(userId: string): Promise<Complaint[]> {
  const ids = await redis.smembers(`user:complaints:${userId}`)
  const complaints: Complaint[] = []
  for (const id of ids) {
    const c = await getComplaint(id)
    if (c) complaints.push(c)
  }
  return complaints.sort((a, b) => b.createdAt - a.createdAt)
}

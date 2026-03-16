import { redis } from './redis'
import { getPusherServer } from './pusher'
import { v4 as uuidv4 } from 'uuid'

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
    id: uuidv4(),
    status: 'matching',
    groupId: null,
    createdAt: Date.now(),
  }
  await redis.set(`complaint:${complaint.id}`, JSON.stringify(complaint), { ex: 30 * 86400 })
  await redis.sadd(`user:complaints:${complaint.userId}`, complaint.id)

  // Find or create group
  const groupId = await findOrCreateGroup(complaint)
  complaint.groupId = groupId
  complaint.status = 'matching'
  await redis.set(`complaint:${complaint.id}`, JSON.stringify(complaint), { ex: 30 * 86400 })

  return complaint
}

export async function findOrCreateGroup(complaint: Complaint): Promise<string> {
  // 1. Exact match: same brand + same category
  const exactKey = `group:index:${complaint.brand}:${complaint.category}`
  const existingGroup = await redis.get<string>(exactKey)
  if (existingGroup) {
    await joinGroup(existingGroup, complaint)
    return existingGroup
  }

  // 2. Fuzzy match: same brand + similar category
  const brandGroups = await redis.smembers(`brand:groups:${complaint.brand}`)
  for (const groupId of brandGroups) {
    const groupData = await redis.get<string>(`group:${groupId}`)
    if (groupData) {
      const group: MatchGroup = JSON.parse(groupData)
      if (isSimilarCategory(complaint.category, group.category)) {
        await joinGroup(groupId, complaint)
        return groupId
      }
    }
  }

  // 3. Create new group
  return await createGroup(complaint)
}

async function createGroup(complaint: Complaint): Promise<string> {
  const groupId = uuidv4()
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

  // Update group count
  const memberIds = await redis.smembers(`group:complaints:${groupId}`)
  const count = memberIds.length
  const groupData = await redis.get<string>(`group:${groupId}`)
  if (groupData) {
    const group: MatchGroup = JSON.parse(groupData)
    group.count = count
    group.updatedAt = Date.now()
    if (count >= group.threshold && group.status === 'forming') {
      group.status = 'ready'
    }
    await redis.set(`group:${groupId}`, JSON.stringify(group), { ex: 30 * 86400 })
  }

  // Pusher realtime push
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
  const data = await redis.get<string>(`complaint:${id}`)
  return data ? JSON.parse(data) : null
}

export async function getGroup(id: string): Promise<MatchGroup | null> {
  const data = await redis.get<string>(`group:${id}`)
  return data ? JSON.parse(data) : null
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

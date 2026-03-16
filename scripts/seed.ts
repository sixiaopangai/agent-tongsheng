/**
 * Seed script: pre-fill Redis with demo complaints and groups.
 *
 * Usage: npx tsx scripts/seed.ts
 *
 * Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars.
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local from project root
config({ path: resolve(__dirname, '..', '.env.local') })

import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

interface Complaint {
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

interface MatchGroup {
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

interface TimelineEvent {
  type: string
  message: string
  timestamp: number
}

const now = Date.now()
const hour = 3600_000

// --- 4 Groups ---
const groups: MatchGroup[] = [
  {
    id: 'g-huawei-screen',
    brand: '华为',
    category: '质量问题',
    count: 3,
    threshold: 5,
    reportUrl: null,
    status: 'forming',
    createdAt: now - 48 * hour,
    updatedAt: now - 2 * hour,
  },
  {
    id: 'g-pdd-ads',
    brand: '拼多多',
    category: '虚假宣传',
    count: 3,
    threshold: 5,
    reportUrl: null,
    status: 'forming',
    createdAt: now - 36 * hour,
    updatedAt: now - 1 * hour,
  },
  {
    id: 'g-haidilao-food',
    brand: '海底捞',
    category: '食品安全',
    count: 1,
    threshold: 10,
    reportUrl: null,
    status: 'forming',
    createdAt: now - 12 * hour,
    updatedAt: now - 12 * hour,
  },
  {
    id: 'g-sf-logistics',
    brand: '顺丰',
    category: '物流损坏',
    count: 1,
    threshold: 10,
    reportUrl: null,
    status: 'forming',
    createdAt: now - 6 * hour,
    updatedAt: now - 6 * hour,
  },
]

// --- 8 Complaints ---
const complaints: Complaint[] = [
  // 华为 ×3
  {
    id: 'c-hw-1',
    userId: 'seed-user-1',
    raw: '华为Mate 60买了不到一个月，屏幕出现绿线，售后说是人为损坏不给保修',
    brand: '华为',
    category: '质量问题',
    timeline: '购买一个月内',
    demand: '免费换屏或退货',
    severity: 4,
    summary: 'Mate 60 屏幕绿线，售后拒绝保修',
    status: 'matching',
    groupId: 'g-huawei-screen',
    createdAt: now - 48 * hour,
  },
  {
    id: 'c-hw-2',
    userId: 'seed-user-2',
    raw: '华为Mate 60 Pro屏幕闪烁严重，官方售后检测说没问题，但肉眼可见闪屏',
    brand: '华为',
    category: '售后问题',
    timeline: '购买两周',
    demand: '重新检测并维修',
    severity: 3,
    summary: 'Mate 60 Pro 屏幕闪烁，售后不认可问题',
    status: 'matching',
    groupId: 'g-huawei-screen',
    createdAt: now - 24 * hour,
  },
  {
    id: 'c-hw-3',
    userId: 'seed-user-3',
    raw: '华为Mate 60屏幕触控失灵，经常点不动，售后让我付费维修，明明还在保修期',
    brand: '华为',
    category: '质量问题',
    timeline: '保修期内',
    demand: '免费维修',
    severity: 4,
    summary: 'Mate 60 触控失灵，保修期内被要求付费维修',
    status: 'matching',
    groupId: 'g-huawei-screen',
    createdAt: now - 2 * hour,
  },
  // 拼多多 ×3
  {
    id: 'c-pdd-1',
    userId: 'seed-user-4',
    raw: '拼多多百亿补贴买的iPhone，到手发现是翻新机，商家拒绝退货',
    brand: '拼多多',
    category: '虚假宣传',
    timeline: '收货当天',
    demand: '退一赔三',
    severity: 5,
    summary: '百亿补贴iPhone为翻新机，商家拒退',
    status: 'matching',
    groupId: 'g-pdd-ads',
    createdAt: now - 36 * hour,
  },
  {
    id: 'c-pdd-2',
    userId: 'seed-user-5',
    raw: '拼多多百亿补贴标价全网最低，实际加上运费比京东还贵，虚假宣传',
    brand: '拼多多',
    category: '虚假宣传',
    timeline: '下单时发现',
    demand: '补差价并整改',
    severity: 3,
    summary: '百亿补贴标价虚假，实际价格高于其他平台',
    status: 'matching',
    groupId: 'g-pdd-ads',
    createdAt: now - 20 * hour,
  },
  {
    id: 'c-pdd-3',
    userId: 'seed-user-6',
    raw: '拼多多百亿补贴买的戴森吹风机，收到是假货，平台介入后只退款不赔偿',
    brand: '拼多多',
    category: '虚假宣传',
    timeline: '收货后验证',
    demand: '假一赔十',
    severity: 5,
    summary: '百亿补贴戴森为假货，平台仅退款不赔偿',
    status: 'matching',
    groupId: 'g-pdd-ads',
    createdAt: now - 1 * hour,
  },
  // 海底捞 ×1
  {
    id: 'c-hdl-1',
    userId: 'seed-user-7',
    raw: '海底捞火锅汤底里吃出异物，疑似塑料片，店员态度敷衍只给打了个折',
    brand: '海底捞',
    category: '食品安全',
    timeline: '就餐当天',
    demand: '道歉并赔偿',
    severity: 4,
    summary: '火锅汤底发现异物，店方处理敷衍',
    status: 'matching',
    groupId: 'g-haidilao-food',
    createdAt: now - 12 * hour,
  },
  // 顺丰 ×1
  {
    id: 'c-sf-1',
    userId: 'seed-user-8',
    raw: '顺丰寄的电脑显示器到货后碎了，包装完好但内部没有任何缓冲材料，理赔只给200',
    brand: '顺丰',
    category: '物流损坏',
    timeline: '收货时',
    demand: '全额赔偿',
    severity: 4,
    summary: '显示器运输损坏，缓冲不足，理赔金额过低',
    status: 'matching',
    groupId: 'g-sf-logistics',
    createdAt: now - 6 * hour,
  },
]

// --- Timeline events ---
const timelines: Record<string, TimelineEvent[]> = {
  'g-huawei-screen': [
    { type: 'group_created', message: '聚合组创建：华为 - 质量问题', timestamp: now - 48 * hour },
    { type: 'member_joined', message: '第 1 位同命人加入', timestamp: now - 48 * hour },
    { type: 'member_joined', message: '第 2 位同命人加入', timestamp: now - 24 * hour },
    { type: 'member_joined', message: '第 3 位同命人加入', timestamp: now - 2 * hour },
  ],
  'g-pdd-ads': [
    { type: 'group_created', message: '聚合组创建：拼多多 - 虚假宣传', timestamp: now - 36 * hour },
    { type: 'member_joined', message: '第 1 位同命人加入', timestamp: now - 36 * hour },
    { type: 'member_joined', message: '第 2 位同命人加入', timestamp: now - 20 * hour },
    { type: 'member_joined', message: '第 3 位同命人加入', timestamp: now - 1 * hour },
  ],
  'g-haidilao-food': [
    { type: 'group_created', message: '聚合组创建：海底捞 - 食品安全', timestamp: now - 12 * hour },
    { type: 'member_joined', message: '第 1 位同命人加入', timestamp: now - 12 * hour },
  ],
  'g-sf-logistics': [
    { type: 'group_created', message: '聚合组创建：顺丰 - 物流损坏', timestamp: now - 6 * hour },
    { type: 'member_joined', message: '第 1 位同命人加入', timestamp: now - 6 * hour },
  ],
}

async function seed() {
  console.log('Seeding Redis...')

  const pipe = redis.pipeline()

  // Groups
  for (const g of groups) {
    pipe.set(`group:${g.id}`, JSON.stringify(g), { ex: 30 * 86400 })
    pipe.set(`group:index:${g.brand}:${g.category}`, g.id, { ex: 30 * 86400 })
    pipe.sadd(`brand:groups:${g.brand}`, g.id)
    pipe.sadd('all:groups', g.id)
  }

  // Complaints
  for (const c of complaints) {
    pipe.set(`complaint:${c.id}`, JSON.stringify(c), { ex: 30 * 86400 })
    pipe.sadd(`user:complaints:${c.userId}`, c.id)
    pipe.sadd(`group:complaints:${c.groupId!}`, c.id)
    pipe.set(`complaint:group:${c.id}`, c.groupId!, { ex: 30 * 86400 })
    pipe.sadd('all:users', c.userId)
  }

  // Stats
  pipe.set('stat:complaints', complaints.length.toString())

  await pipe.exec()

  // Timeline events (rpush doesn't work well in pipeline with arrays, do sequentially)
  for (const [groupId, events] of Object.entries(timelines)) {
    for (const event of events) {
      await redis.rpush(`group:timeline:${groupId}`, JSON.stringify(event))
    }
    await redis.expire(`group:timeline:${groupId}`, 30 * 86400)
  }

  console.log(`Done! Seeded ${complaints.length} complaints in ${groups.length} groups.`)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})

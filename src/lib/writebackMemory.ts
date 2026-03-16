import { getValidToken } from './auth'
import { redis } from './redis'
import type { Complaint } from './matchingEngine'

const SECONDME_BASE = 'https://api.mindverse.com/gate/lab'

export async function writebackToUserMemory(
  complaint: Complaint,
  groupId: string,
  reportUrl: string
) {
  const token = await getValidToken(complaint.userId)
  const groupData = await redis.get<string>(`group:${groupId}`)
  const groupCount = groupData ? JSON.parse(groupData).count : 0

  const res = await fetch(`${SECONDME_BASE}/api/secondme/agent_memory/ingest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channel: {
        kind: 'thread',
        url: reportUrl,
      },
      action: 'complaint_resolved',
      actionLabel: '参与了集体维权',
      displayText: `在 Agent同声 参与了针对「${complaint.brand}」的集体维权，共 ${groupCount} 人，问题：${complaint.summary}`,
      refs: [
        {
          objectType: 'thread',
          objectId: `complaint_${complaint.id}`,
          contentPreview: `品牌：${complaint.brand}，问题：${complaint.summary}，参与人数：${groupCount}`,
        },
      ],
      importance: 0.8,
      idempotencyKey: `writeback_${complaint.id}_${groupId}`,
    }),
  })

  const json = await res.json()
  if (json.code !== 0) throw new Error(json.message || 'Memory writeback failed')
  return json.data
}

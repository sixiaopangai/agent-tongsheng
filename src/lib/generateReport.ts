import { getValidToken } from './auth'
import { getGroupComplaints, getGroup, addTimelineEvent } from './matchingEngine'
import { writebackToUserMemory } from './writebackMemory'
import { redis } from './redis'

const SECONDME_BASE = 'https://api.mindverse.com/gate/lab'

async function collectSSEText(res: Response): Promise<string> {
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  const parts: string[] = []

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const text = decoder.decode(value)
    for (const line of text.split('\n')) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        try {
          const data = JSON.parse(line.slice(6))
          const content = data?.choices?.[0]?.delta?.content
          if (content) parts.push(content)
        } catch {}
      }
    }
  }
  return parts.join('')
}

export async function generateCollectiveReport(groupId: string): Promise<string> {
  const complaints = await getGroupComplaints(groupId)
  if (complaints.length === 0) throw new Error('No complaints in group')

  // Step 1: Each agent contributes a statement (parallel)
  const statements = await Promise.allSettled(
    complaints.slice(0, 20).map(async (complaint) => {
      try {
        const token = await getValidToken(complaint.userId)
        const res = await fetch(`${SECONDME_BASE}/api/secondme/chat/stream`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `请用第一人称简述你的遭遇，不超过100字：${complaint.raw}`,
            systemPrompt: '你是这位用户的 AI 分身，正在参与集体维权行动。用简洁有力的语言陈述事实。',
          }),
        })
        return await collectSSEText(res)
      } catch {
        return complaint.summary // fallback to summary
      }
    })
  )

  const validStatements = statements
    .map((r) => (r.status === 'fulfilled' ? r.value : ''))
    .filter(Boolean)

  // Step 2: Use one user's SecondMe chat/stream to summarize (or fallback to raw aggregation)
  const firstToken = await getValidToken(complaints[0].userId)
  const prompt = `你正在起草一份消费者集体投诉报告。
品牌：${complaints[0].brand}
问题类型：${complaints[0].category}
参与人数：${complaints.length}

各方陈述：
${validStatements.map((s, i) => `消费者${i + 1}：${s}`).join('\n')}

请生成一份正式的集体投诉报告，包含：
1. 问题概述（150字以内）
2. 共同诉求（列点）
3. 事实陈述（整合各方陈述，去重）
4. 结尾：要求品牌在7日内书面回复

语气正式，以事实为主。`

  const res = await fetch(`${SECONDME_BASE}/api/secondme/chat/stream`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${firstToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: prompt }),
  })

  const report = await collectSSEText(res)

  // Store report
  await redis.set(`group:report:${groupId}`, report, { ex: 30 * 86400 })

  // Update group status
  const group = await getGroup(groupId)
  if (group) {
    group.status = 'reported'
    group.reportUrl = `/group/${groupId}/report`
    await redis.set(`group:${groupId}`, JSON.stringify(group), { ex: 30 * 86400 })
  }

  // Timeline event
  await addTimelineEvent(groupId, {
    type: 'report_generated',
    message: '集体投诉报告已生成',
    timestamp: Date.now(),
  })

  // Writeback to each user's SecondMe memory (best-effort)
  const reportUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/group/${groupId}`
  await Promise.allSettled(
    complaints.map((c) =>
      writebackToUserMemory(c, groupId, reportUrl).catch(() => {})
    )
  )

  return report
}

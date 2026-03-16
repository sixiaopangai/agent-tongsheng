const SECONDME_BASE = 'https://api.mindverse.com/gate/lab'

const ACTION_CONTROL = `
仅输出合法 JSON 对象，不要任何解释文字。

输出结构：
{
  "brand": "string，品牌名称，无法识别填 unknown",
  "category": "质量问题 | 售后问题 | 虚假宣传 | 物流问题 | 其他",
  "timeline": "string，事件时间线一句话概括",
  "demand": "退款 | 维修 | 赔偿 | 道歉 | 其他",
  "severity": "number，1到5的整数，1最轻5最严重",
  "summary": "string，20字以内的问题摘要"
}

判断规则：根据用户描述的品牌名、问题类型、时间顺序和诉求提取信息。严重程度参考：涉及人身安全=5，大额经济损失=4，反复推诿=3，一般不满=2，轻微瑕疵=1。
兜底规则：任何字段无法判断时填写 unknown 或 "其他"，severity 默认填 2。
`

export interface IntentResult {
  brand: string
  category: string
  timeline: string
  demand: string
  severity: number
  summary: string
}

export async function extractIntent(raw: string, accessToken: string): Promise<IntentResult> {
  const res = await fetch(`${SECONDME_BASE}/api/secondme/act/stream`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: raw,
      actionControl: ACTION_CONTROL,
    }),
  })

  if (!res.ok) throw new Error(`act/stream failed: ${res.status}`)

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  const jsonParts: string[] = []

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const text = decoder.decode(value)
    for (const line of text.split('\n')) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        try {
          const data = JSON.parse(line.slice(6))
          const content = data?.choices?.[0]?.delta?.content
          if (content) jsonParts.push(content)
        } catch {}
      }
    }
  }

  const raw_json = jsonParts.join('')
  // Extract JSON from possible markdown code block
  const match = raw_json.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Failed to parse intent JSON')
  return JSON.parse(match[0])
}

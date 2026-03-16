'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import MatchCounter from '@/components/MatchCounter'
import Timeline from '@/components/Timeline'
import ZhihuComments from '@/components/ZhihuComments'

export default function GroupPage() {
  const { id } = useParams<{ id: string }>()
  const [group, setGroup] = useState<any>(null)
  const [report, setReport] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishResult, setPublishResult] = useState<string | null>(null)
  const [publishedPinId, setPublishedPinId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/groups/${id}`)
      .then((r) => r.json())
      .then((d) => { if (d?.code === 0) setGroup(d.data) })
  }, [id])

  const handleGenerateReport = async () => {
    setGenerating(true)
    setError('')
    try {
      const res = await fetch(`/api/groups/${id}/report`)
      const data = await res.json()
      if (data?.code === 0) {
        setReport(data.data.report)
      } else {
        setError(data.error || '报告生成失败')
      }
    } catch {
      setError('网络错误')
    } finally {
      setGenerating(false)
    }
  }

  const handlePublishToZhihu = async () => {
    if (!report) return
    setPublishing(true)
    try {
      const res = await fetch('/api/zhihu/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: report }),
      })
      const data = await res.json()
      if (data?.code === 0) {
        setPublishResult('已发布到知乎圈子')
        const pinId = data.data?.pin_id || data.data?.data?.pin_id || data.data?.id
        if (pinId) setPublishedPinId(pinId)
      } else {
        setPublishResult('发布失败：' + (data.error || '未知错误'))
      }
    } catch {
      setPublishResult('发布失败：网络错误')
    } finally {
      setPublishing(false)
    }
  }

  if (!group) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="border-b border-slate-800 px-6 py-4">
        <a href="/" className="text-slate-400 hover:text-white text-sm">← 返回首页</a>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{group.brand}</h1>
          <span className="text-slate-500">{group.category}</span>
        </div>

        <div className="flex justify-center mb-8">
          <MatchCounter groupId={id} initialCount={group.count} />
        </div>

        {/* Progress */}
        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 mb-6">
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span>聚合进度</span>
            <span>{group.count} / {group.threshold}</span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all"
              style={{ width: `${Math.min((group.count / group.threshold) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Timeline */}
        <Timeline events={group.timeline || []} />

        {/* Complaints list */}
        {group.complaints?.length > 0 && (
          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 mb-6">
            <h2 className="text-sm font-medium text-slate-400 mb-3">同命人的声音</h2>
            <div className="space-y-3">
              {group.complaints.map((c: any, i: number) => (
                <div key={c.id} className="flex items-start gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-400 shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-slate-300">{c.summary}</p>
                    <span className="text-xs text-slate-600">
                      诉求：{c.demand} · 严重度 {c.severity}/5
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Report section */}
        {report ? (
          <div className="bg-slate-800/50 rounded-xl p-6 border border-green-800">
            <h2 className="text-green-400 font-medium mb-3">集体投诉报告</h2>
            <div className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{report}</div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => navigator.clipboard.writeText(report)}
                className="px-4 py-2 text-sm bg-slate-700 rounded-lg hover:bg-slate-600 transition"
              >
                复制报告
              </button>
              <button
                onClick={handlePublishToZhihu}
                disabled={publishing}
                className="px-4 py-2 text-sm bg-blue-700 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition"
              >
                {publishing ? '发布中...' : '发布到知乎圈子'}
              </button>
            </div>
            {publishResult && (
              <p className={`text-sm mt-2 ${publishResult.includes('失败') ? 'text-red-400' : 'text-green-400'}`}>
                {publishResult}
              </p>
            )}
          </div>
        ) : (
          <button
            onClick={handleGenerateReport}
            disabled={generating || group.count < group.threshold}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 font-medium disabled:opacity-40 hover:opacity-90 transition"
          >
            {generating ? '报告生成中...' : group.count < group.threshold ? `还需 ${group.threshold - group.count} 人达到阈值` : '生成集体报告'}
          </button>
        )}
        {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}

        {/* Comments section — shown after publishing to Zhihu */}
        {publishedPinId && (
          <ZhihuComments targetId={publishedPinId} targetType="pin" />
        )}
      </div>
    </main>
  )
}

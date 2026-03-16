'use client'

import { useState, useEffect } from 'react'

interface Complaint {
  id: string
  brand: string
  category: string
  summary: string
  severity: number
  status: string
  groupId: string | null
  createdAt: number
}

export default function HistoryPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/user/complaints')
      .then((r) => r.json())
      .then((d) => {
        if (d?.code === 0) setComplaints(d.data || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const statusLabel: Record<string, string> = {
    pending: '待处理',
    matching: '匹配中',
    aggregated: '已聚合',
    resolved: '已解决',
  }

  const statusColor: Record<string, string> = {
    pending: 'text-slate-400',
    matching: 'text-orange-400',
    aggregated: 'text-blue-400',
    resolved: 'text-green-400',
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <a href="/" className="text-slate-400 hover:text-white text-sm">← 返回首页</a>
        <span className="text-lg font-semibold">我的投诉</span>
        <div className="w-16" />
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
          </div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-500 mb-4">你还没有提交过投诉</p>
            <a href="/" className="text-orange-400 hover:underline text-sm">去首页提交投诉</a>
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map((c) => (
              <div key={c.id} className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-medium text-white">{c.brand}</span>
                    <span className="text-slate-500 text-sm ml-2">{c.category}</span>
                  </div>
                  <span className={`text-xs ${statusColor[c.status] || 'text-slate-400'}`}>
                    {statusLabel[c.status] || c.status}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-2">{c.summary}</p>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>严重度 {'●'.repeat(c.severity)}{'○'.repeat(5 - c.severity)}</span>
                  <span>{new Date(c.createdAt).toLocaleString('zh-CN')}</span>
                </div>
                {c.groupId && (
                  <a href={`/group/${c.groupId}`} className="inline-block mt-2 text-orange-400 text-xs hover:underline">
                    查看聚合组 →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

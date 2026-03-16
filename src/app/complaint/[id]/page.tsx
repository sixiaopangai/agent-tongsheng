'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

export default function ComplaintPage() {
  const { id } = useParams<{ id: string }>()
  const [complaint, setComplaint] = useState<any>(null)

  useEffect(() => {
    // Poll for complaint status
    const poll = async () => {
      try {
        const res = await fetch(`/api/complaints/${id}`)
        const data = await res.json()
        if (data?.code === 0) setComplaint(data.data)
      } catch {}
    }
    poll()
    const interval = setInterval(poll, 5000)
    return () => clearInterval(interval)
  }, [id])

  if (!complaint) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </main>
    )
  }

  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: '等待分析', color: 'text-yellow-400' },
    matching: { label: '寻找同命人中', color: 'text-orange-400' },
    aggregated: { label: '已聚合', color: 'text-blue-400' },
    resolved: { label: '已生成报告', color: 'text-green-400' },
  }

  const status = statusMap[complaint.status] || statusMap.pending

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="border-b border-slate-800 px-6 py-4">
        <a href="/" className="text-slate-400 hover:text-white text-sm">← 返回首页</a>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">{complaint.brand}</h1>
            <span className={`text-sm font-medium ${status.color}`}>{status.label}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div><span className="text-slate-500">类型：</span>{complaint.category}</div>
            <div><span className="text-slate-500">诉求：</span>{complaint.demand}</div>
            <div><span className="text-slate-500">严重度：</span>{'●'.repeat(complaint.severity)}{'○'.repeat(5 - complaint.severity)}</div>
            <div><span className="text-slate-500">时间线：</span>{complaint.timeline}</div>
          </div>

          <p className="text-slate-400 text-sm border-t border-slate-700 pt-4">{complaint.raw}</p>

          {complaint.groupId && (
            <a
              href={`/group/${complaint.groupId}`}
              className="inline-block mt-4 px-4 py-2 bg-orange-600/20 text-orange-400 rounded-lg text-sm hover:bg-orange-600/30 transition"
            >
              查看聚合组 →
            </a>
          )}
        </div>
      </div>
    </main>
  )
}

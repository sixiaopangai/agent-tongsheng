'use client'

import { useState, useEffect } from 'react'

interface Stats {
  users: number
  complaints: number
  groups: number
}

export default function StatsBar() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((d) => { if (d?.code === 0) setStats(d.data) })
  }, [])

  if (!stats) return null

  const items = [
    { label: '参与用户', value: stats.users },
    { label: '投诉总数', value: stats.complaints },
    { label: '聚合组数', value: stats.groups },
  ]

  return (
    <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
      {items.map((item) => (
        <div key={item.label} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-center">
          <div className="text-2xl font-bold text-orange-400 tabular-nums">{item.value}</div>
          <div className="text-slate-500 text-xs mt-1">{item.label}</div>
        </div>
      ))}
    </div>
  )
}

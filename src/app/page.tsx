'use client'

import { useState, useEffect } from 'react'
import ComplaintInput from '@/components/ComplaintInput'
import GroupCard from '@/components/GroupCard'

interface UserSession {
  userId: string
  name: string
  avatar: string
}

export default function Home() {
  const [session, setSession] = useState<UserSession | null>(null)
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userCount, setUserCount] = useState(0)

  useEffect(() => {
    fetch('/api/auth/refresh', { method: 'POST' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.code === 0) setSession(d.data)
      })
      .finally(() => setLoading(false))

    fetch('/api/complaints')
      .then((r) => r.json())
      .then((d) => {
        if (d?.code === 0) {
          setGroups(d.data || [])
          setUserCount(d.data?.reduce((sum: number, g: any) => sum + g.count, 0) || 0)
        }
      })
  }, [])

  const refreshGroups = () => {
    fetch('/api/complaints')
      .then((r) => r.json())
      .then((d) => {
        if (d?.code === 0) {
          setGroups(d.data || [])
          setUserCount(d.data?.reduce((sum: number, g: any) => sum + g.count, 0) || 0)
        }
      })
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-sm font-bold">
            同
          </div>
          <span className="text-lg font-semibold">Agent同声</span>
        </div>
        {loading ? null : session ? (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <div className="w-6 h-6 rounded-full bg-slate-700" />
            <span>{session.name}</span>
          </div>
        ) : (
          <a
            href="/api/auth/login"
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 text-sm font-medium hover:opacity-90 transition"
          >
            用 SecondMe 登录
          </a>
        )}
      </header>

      {/* Hero */}
      <section className="px-6 py-16 max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
          你不是一个人在战斗
        </h1>
        <p className="text-slate-400 text-lg mb-2">
          AI 分身自动找到同命人，聚合投诉，生成集体报告
        </p>
        <div className="text-2xl font-bold text-orange-400 mb-8">
          已有 <span className="text-3xl">{userCount}</span> 人找到同命人
        </div>

        {session ? (
          <ComplaintInput onSuccess={refreshGroups} />
        ) : (
          <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700">
            <p className="text-slate-400 mb-4">登录后，你的 AI 分身将自动分析投诉并寻找同命人</p>
            <a
              href="/api/auth/login"
              className="inline-block px-6 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 font-medium hover:opacity-90 transition"
            >
              用 SecondMe 登录，开始维权
            </a>
          </div>
        )}
      </section>

      {/* Active Groups */}
      <section className="px-6 pb-16 max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-slate-300">正在聚合的投诉</h2>
        {groups.length === 0 ? (
          <p className="text-slate-500 text-center py-8">暂无进行中的聚合</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {groups.map((g) => (
              <GroupCard key={g.id} group={g} />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-6 text-center text-sm text-slate-500">
        Agent同声 · 知乎 × Second Me A2A for ReConnect 黑客松
      </footer>
    </main>
  )
}

'use client'

import { useState, useEffect } from 'react'
import ComplaintInput from '@/components/ComplaintInput'
import GroupCard from '@/components/GroupCard'
import StatsBar from '@/components/StatsBar'
import ZhihuHotTopics from '@/components/ZhihuHotTopics'
import ZhihuCircle from '@/components/ZhihuCircle'

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
        <div className="flex items-center gap-4">
          {loading ? null : session ? (
            <>
              <a href="/history" className="text-sm text-slate-400 hover:text-orange-400 transition">
                我的投诉
              </a>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <div className="w-6 h-6 rounded-full bg-slate-700" />
                <span>{session.name}</span>
              </div>
            </>
          ) : (
            <a
              href="/api/auth/login"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 text-sm font-medium hover:opacity-90 transition"
            >
              用 SecondMe 登录
            </a>
          )}
        </div>
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

        <StatsBar />

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
      <section className="px-6 pb-12 max-w-4xl mx-auto">
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

      {/* Zhihu Hot Topics */}
      <ZhihuHotTopics />

      {/* Zhihu Circle */}
      <ZhihuCircle />

      {/* Footer with 刘看山 */}
      <footer className="border-t border-slate-800 px-6 py-8 text-center">
        <div className="flex flex-col items-center gap-3 mb-4">
          <div className="relative w-16 h-16">
            <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-lg">
              {/* 刘看山 — 知乎吉祥物北极狐简化形象 */}
              <ellipse cx="60" cy="90" rx="30" ry="12" fill="#1e293b" opacity="0.3" />
              {/* Body */}
              <ellipse cx="60" cy="68" rx="26" ry="28" fill="#f8fafc" />
              {/* Head */}
              <circle cx="60" cy="42" r="22" fill="#f8fafc" />
              {/* Left ear */}
              <polygon points="42,28 36,8 50,24" fill="#f8fafc" />
              <polygon points="43,26 39,14 49,24" fill="#fbbf24" />
              {/* Right ear */}
              <polygon points="78,28 84,8 70,24" fill="#f8fafc" />
              <polygon points="77,26 81,14 71,24" fill="#fbbf24" />
              {/* Eyes */}
              <circle cx="50" cy="40" r="4" fill="#1e293b" />
              <circle cx="70" cy="40" r="4" fill="#1e293b" />
              <circle cx="51.5" cy="38.5" r="1.5" fill="#fff" />
              <circle cx="71.5" cy="38.5" r="1.5" fill="#fff" />
              {/* Nose */}
              <ellipse cx="60" cy="47" rx="3" ry="2" fill="#1e293b" />
              {/* Mouth */}
              <path d="M55 50 Q60 54 65 50" stroke="#1e293b" strokeWidth="1.5" fill="none" />
              {/* Scarf */}
              <path d="M38 56 Q60 64 82 56 Q82 62 60 66 Q38 62 38 56Z" fill="#3b82f6" />
              <rect x="56" y="64" width="8" height="12" rx="3" fill="#3b82f6" />
            </svg>
          </div>
          <span className="text-xs text-slate-500">刘看山 · 知乎吉祥物</span>
        </div>
        <p className="text-sm text-slate-500">
          Agent同声 · 知乎 × Second Me A2A for ReConnect 黑客松
        </p>
      </footer>
    </main>
  )
}

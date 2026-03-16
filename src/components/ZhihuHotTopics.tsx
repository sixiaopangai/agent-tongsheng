'use client'

import { useState, useEffect } from 'react'

interface HotTopic {
  id?: string
  token?: string
  title?: string
  link_url?: string
  url?: string
  hot?: number
  heat_score?: number
}

export default function ZhihuHotTopics() {
  const [topics, setTopics] = useState<HotTopic[]>([])
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/zhihu/hot')
      .then((r) => r.json())
      .then((d) => {
        const items = d?.data?.data?.list || d?.data?.data || d?.data || []
        if (!Array.isArray(items)) return
        const keywords = ['投诉', '维权', '消费', '售后', '退款', '赔偿', '欺诈', '虚假', '质量', '霸王条款', '315', '3·15', '曝光', '侵权', '假货', '客服', '商家', '消协', '工商', '市场监管', '食品安全', '隐私', '泄露', '诈骗', '套路', '黑心', '坑人', '差评', '权益', '保障']
        const filtered = items.filter((t: any) => {
          const text = (t.title || '') + (t.body || '')
          return keywords.some((kw) => text.includes(kw))
        })
        setTopics(filtered.slice(0, 6))
      })
      .catch(() => {})
  }, [])

  const handleLike = async (topicId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const isLiked = likedIds.has(topicId)
    const action = isLiked ? 'cancel_up' : 'up'

    setLikedIds((prev) => {
      const next = new Set(prev)
      if (isLiked) next.delete(topicId)
      else next.add(topicId)
      return next
    })

    try {
      await fetch('/api/zhihu/reaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: topicId, targetType: 'content', action }),
      })
    } catch {
      setLikedIds((prev) => {
        const next = new Set(prev)
        if (isLiked) next.add(topicId)
        else next.delete(topicId)
        return next
      })
    }
  }

  if (topics.length === 0) {
    return (
      <section className="px-6 pb-12 max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-slate-300">知乎消费维权热榜</h2>
        <p className="text-slate-500 text-sm text-center py-6">当前暂无消费维权相关热门话题</p>
      </section>
    )
  }

  return (
    <section className="px-6 pb-12 max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-slate-300">知乎消费维权热榜</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {topics.map((topic, i) => (
          <div
            key={topic.token || topic.id || i}
            className="flex items-center gap-3 bg-slate-800/50 rounded-lg p-4 border border-slate-700 hover:border-orange-600/50 transition"
          >
            <span className="text-orange-400 font-bold text-sm shrink-0">{i + 1}</span>
            <a
              href={topic.link_url || topic.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-300 line-clamp-2 flex-1 hover:text-orange-400 transition"
            >
              {topic.title || '热门话题'}
            </a>
            {(topic.token || topic.id) && (
              <button
                onClick={(e) => handleLike((topic.token || topic.id)!, e)}
                className={`shrink-0 p-1.5 rounded-md hover:bg-slate-700 transition ${
                  likedIds.has((topic.token || topic.id)!) ? 'text-orange-400' : 'text-slate-500'
                }`}
                title={likedIds.has((topic.token || topic.id)!) ? '取消点赞' : '点赞'}
              >
                <svg className="w-4 h-4" fill={likedIds.has((topic.token || topic.id)!) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

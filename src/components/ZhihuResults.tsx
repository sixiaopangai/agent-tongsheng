'use client'

import { useState, useEffect } from 'react'

interface Props {
  keyword: string
}

interface SearchItem {
  id?: string
  title?: string
  url?: string
  excerpt?: string
}

export default function ZhihuResults({ keyword }: Props) {
  const [results, setResults] = useState<SearchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!keyword) return
    setLoading(true)
    fetch(`/api/zhihu/search?keyword=${encodeURIComponent(keyword)}`)
      .then((r) => r.json())
      .then((d) => {
        const items = d?.data?.data || d?.data?.results || d?.data || []
        setResults(Array.isArray(items) ? items.slice(0, 5) : [])
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [keyword])

  const handleLike = async (itemId: string) => {
    const isLiked = likedIds.has(itemId)
    const action = isLiked ? 'cancel_up' : 'up'

    setLikedIds((prev) => {
      const next = new Set(prev)
      if (isLiked) next.delete(itemId)
      else next.add(itemId)
      return next
    })

    try {
      await fetch('/api/zhihu/reaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: itemId, targetType: 'content', action }),
      })
    } catch {
      setLikedIds((prev) => {
        const next = new Set(prev)
        if (isLiked) next.add(itemId)
        else next.delete(itemId)
        return next
      })
    }
  }

  if (loading) {
    return (
      <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700 mt-4">
        <div className="text-slate-500 text-sm">正在搜索知乎相关讨论...</div>
      </div>
    )
  }

  if (results.length === 0) return null

  return (
    <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700 mt-4">
      <h3 className="text-sm font-medium text-slate-400 mb-3">知乎相关讨论</h3>
      <div className="space-y-2">
        {results.map((item, i) => (
          <div key={item.id || i} className="flex items-center gap-2">
            <a
              href={item.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-sm text-slate-300 hover:text-orange-400 transition truncate"
            >
              {item.title || item.excerpt || '相关讨论'}
            </a>
            {item.id && (
              <button
                onClick={() => handleLike(item.id!)}
                className={`shrink-0 p-1 rounded hover:bg-slate-700 transition ${
                  likedIds.has(item.id) ? 'text-orange-400' : 'text-slate-500'
                }`}
                title={likedIds.has(item.id) ? '取消点赞' : '点赞'}
              >
                <svg className="w-3.5 h-3.5" fill={likedIds.has(item.id) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

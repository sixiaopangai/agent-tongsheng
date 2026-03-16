'use client'

import { useState, useEffect } from 'react'

interface CircleInfo {
  ring_name?: string
  ring_desc?: string
  ring_avatar?: string
  membership_num?: number
  discussion_num?: number
}

interface Pin {
  pin_id?: number
  content?: string
  author_name?: string
  publish_time?: number
  comment_num?: number
  upvote_num?: number
  like_num?: number
}

const DEFAULT_RING_ID = '2001009660925334090'

export default function ZhihuCircle() {
  const [info, setInfo] = useState<CircleInfo | null>(null)
  const [pins, setPins] = useState<Pin[]>([])
  const [loading, setLoading] = useState(true)
  const [likedPins, setLikedPins] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch(`/api/zhihu/circle?ringId=${DEFAULT_RING_ID}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.code === 0) {
          const infoData = d.data?.info?.data || d.data?.info || {}
          setInfo(infoData?.ring_info || infoData || null)
          const contents = infoData?.contents || d.data?.pins?.data || []
          if (!Array.isArray(contents)) return
          const keywords = ['投诉', '维权', '消费', '售后', '退款', '赔偿', '欺诈', '虚假', '质量', '霸王条款', '315', '3·15', '曝光', '侵权', '假货', '客服', '商家', '消协', '权益', '保障', '坑', '差评', '黑心', '套路', '诈骗', '食品安全']
          const filtered = contents.filter((p: any) => {
            const text = (p.content || '') + (p.author_name || '')
            return keywords.some((kw) => text.includes(kw))
          })
          setPins(filtered.length > 0 ? filtered.slice(0, 8) : contents.slice(0, 8))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleLike = async (pinId: string) => {
    const isLiked = likedPins.has(pinId)
    const action = isLiked ? 'cancel_up' : 'up'

    setLikedPins((prev) => {
      const next = new Set(prev)
      if (isLiked) next.delete(pinId)
      else next.add(pinId)
      return next
    })

    try {
      await fetch('/api/zhihu/reaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: pinId, targetType: 'pin', action }),
      })
    } catch {
      setLikedPins((prev) => {
        const next = new Set(prev)
        if (isLiked) next.add(pinId)
        else next.delete(pinId)
        return next
      })
    }
  }

  if (loading) {
    return (
      <section className="px-6 pb-12 max-w-4xl mx-auto">
        <div className="animate-pulse bg-slate-800/50 rounded-xl h-48" />
      </section>
    )
  }

  // Strip HTML tags from content for display
  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"')

  return (
    <section className="px-6 pb-12 max-w-4xl mx-auto">
      {/* Circle Info */}
      {info && (
        <div className="bg-slate-800/50 rounded-xl p-5 border border-blue-800/40 mb-4">
          <div className="flex items-center gap-3 mb-2">
            {info.ring_avatar ? (
              <img src={info.ring_avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-sm font-bold">
                圈
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold text-slate-200">{info.ring_name || '知乎圈子'}</h2>
              <span className="text-xs text-slate-500">
                {info.membership_num ? `${info.membership_num} 成员` : ''}
                {info.discussion_num ? ` · ${info.discussion_num} 讨论` : ''}
              </span>
            </div>
          </div>
          {info.ring_desc && (
            <p className="text-sm text-slate-400 line-clamp-3">{info.ring_desc}</p>
          )}
        </div>
      )}

      {/* Pins List */}
      {pins.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-4 text-slate-300">圈子动态</h2>
          <div className="space-y-3">
            {pins.map((pin, i) => {
              const pinIdStr = pin.pin_id?.toString() || ''
              return (
                <div
                  key={pinIdStr || i}
                  className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 hover:border-blue-600/40 transition"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-xs">
                      {pin.author_name?.[0] || '匿'}
                    </div>
                    <span className="text-xs text-slate-400">{pin.author_name || '匿名用户'}</span>
                    {pin.publish_time && (
                      <span className="text-xs text-slate-600">
                        {new Date(pin.publish_time * 1000).toLocaleDateString('zh-CN')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-300 line-clamp-3 mb-2">
                    {pin.content ? stripHtml(pin.content) : ''}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <button
                      onClick={() => pinIdStr && handleLike(pinIdStr)}
                      className={`flex items-center gap-1 hover:text-blue-400 transition ${
                        pinIdStr && likedPins.has(pinIdStr) ? 'text-blue-400' : ''
                      }`}
                    >
                      <svg className="w-4 h-4" fill={pinIdStr && likedPins.has(pinIdStr) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                      {pin.upvote_num || pin.like_num || '赞'}
                    </button>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {pin.comment_num || 0} 评论
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}

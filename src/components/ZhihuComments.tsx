'use client'

import { useState, useEffect, useCallback } from 'react'

interface Comment {
  id?: string
  content?: string
  author?: { name?: string }
  created_time?: number
}

interface Props {
  targetId: string
  targetType: string
}

export default function ZhihuComments({ targetId, targetType }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [posting, setPosting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/zhihu/comments?targetId=${encodeURIComponent(targetId)}&targetType=${encodeURIComponent(targetType)}`
      )
      const d = await res.json()
      if (d?.code === 0) {
        const items = d.data?.data || d.data || []
        setComments(Array.isArray(items) ? items : [])
      }
    } catch {}
    setLoading(false)
  }, [targetId, targetType])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handlePost = async () => {
    if (!newComment.trim()) return
    setPosting(true)
    try {
      const res = await fetch('/api/zhihu/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId, targetType, content: newComment }),
      })
      const d = await res.json()
      if (d?.code === 0) {
        setNewComment('')
        await fetchComments()
      }
    } catch {}
    setPosting(false)
  }

  const handleDelete = async (commentId: string) => {
    setDeletingId(commentId)
    try {
      const res = await fetch('/api/zhihu/comment', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId }),
      })
      const d = await res.json()
      if (d?.code === 0) {
        setComments((prev) => prev.filter((c) => c.id !== commentId))
      }
    } catch {}
    setDeletingId(null)
  }

  return (
    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 mt-6">
      <h2 className="text-sm font-medium text-slate-400 mb-4">知乎评论区</h2>

      {/* Post comment */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !posting && handlePost()}
          placeholder="发表评论..."
          className="flex-1 bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition"
        />
        <button
          onClick={handlePost}
          disabled={posting || !newComment.trim()}
          className="px-4 py-2 text-sm bg-blue-700 rounded-lg hover:bg-blue-600 disabled:opacity-40 transition shrink-0"
        >
          {posting ? '发送中...' : '发送'}
        </button>
      </div>

      {/* Comments list */}
      {loading ? (
        <div className="text-sm text-slate-500">加载评论中...</div>
      ) : comments.length === 0 ? (
        <div className="text-sm text-slate-500 text-center py-4">暂无评论，来说两句吧</div>
      ) : (
        <div className="space-y-3">
          {comments.map((c, i) => (
            <div key={c.id || i} className="flex items-start gap-3 group">
              <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-xs text-slate-400 shrink-0">
                {c.author?.name?.[0] || '匿'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-slate-400">{c.author?.name || '匿名用户'}</span>
                  {c.created_time && (
                    <span className="text-xs text-slate-600">
                      {new Date(c.created_time * 1000).toLocaleDateString('zh-CN')}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-300">{c.content}</p>
              </div>
              {c.id && (
                <button
                  onClick={() => handleDelete(c.id!)}
                  disabled={deletingId === c.id}
                  className="text-xs text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition shrink-0"
                >
                  {deletingId === c.id ? '删除中' : '删除'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

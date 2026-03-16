'use client'

import { useState } from 'react'

interface Props {
  onSuccess: () => void
}

export default function ComplaintInput({ onSuccess }: Props) {
  const [text, setText] = useState('')
  const [step, setStep] = useState<'input' | 'analyzing' | 'done'>('input')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!text.trim()) return
    setStep('analyzing')
    setError('')

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (data.code === 0) {
        setResult(data.data)
        setStep('done')
        onSuccess()
      } else {
        setError(data.error || '提交失败')
        setStep('input')
      }
    } catch {
      setError('网络错误，请重试')
      setStep('input')
    }
  }

  if (step === 'analyzing') {
    return (
      <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-slate-300">AI 分身正在分析你的投诉...</p>
        <p className="text-slate-500 text-sm mt-1">正在提取品牌、问题类型、诉求</p>
      </div>
    )
  }

  if (step === 'done' && result) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-6 border border-green-800 text-left">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center text-xs">✓</div>
          <span className="text-green-400 font-medium">投诉已提交，正在寻找同命人</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-slate-500">品牌：</span>{result.brand}</div>
          <div><span className="text-slate-500">类型：</span>{result.category}</div>
          <div><span className="text-slate-500">诉求：</span>{result.demand}</div>
          <div><span className="text-slate-500">严重度：</span>{'●'.repeat(result.severity)}{'○'.repeat(5 - result.severity)}</div>
        </div>
        <p className="text-slate-400 text-sm mt-3">{result.summary}</p>
        {result.groupId && (
          <a href={`/group/${result.groupId}`} className="inline-block mt-4 text-orange-400 text-sm hover:underline">
            查看聚合组 →
          </a>
        )}
        <button
          onClick={() => { setStep('input'); setText(''); setResult(null) }}
          className="block mt-3 text-slate-500 text-sm hover:text-slate-300"
        >
          继续提交
        </button>
      </div>
    )
  }

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="描述你的消费遭遇，比如：我在XX品牌买了一台手机，用了三天就黑屏了，找售后一直推诿..."
        className="w-full bg-transparent border border-slate-600 rounded-lg p-4 text-white placeholder-slate-500 resize-none focus:outline-none focus:border-orange-500 transition"
        rows={4}
      />
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={!text.trim()}
        className="mt-4 w-full py-3 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 font-medium disabled:opacity-40 hover:opacity-90 transition"
      >
        让 AI 分身分析并寻找同命人
      </button>
    </div>
  )
}

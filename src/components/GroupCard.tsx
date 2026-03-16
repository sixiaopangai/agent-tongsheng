'use client'

interface Props {
  group: {
    id: string
    brand: string
    category: string
    count: number
    threshold: number
    status: string
  }
}

export default function GroupCard({ group }: Props) {
  const progress = Math.min((group.count / group.threshold) * 100, 100)
  const isReady = group.status === 'ready' || group.status === 'reported'

  return (
    <a
      href={`/group/${group.id}`}
      className="block bg-slate-800/50 rounded-xl p-5 border border-slate-700 hover:border-orange-600/50 transition"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-white">{group.brand}</h3>
          <span className="text-xs text-slate-500">{group.category}</span>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${
          isReady ? 'bg-green-900/50 text-green-400' : 'bg-orange-900/50 text-orange-400'
        }`}>
          {group.status === 'reported' ? '已生成报告' : isReady ? '可生成报告' : '聚合中'}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>{group.count} 人</span>
          <span>目标 {group.threshold} 人</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </a>
  )
}

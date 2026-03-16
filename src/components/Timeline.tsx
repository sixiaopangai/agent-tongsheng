'use client'

interface TimelineEvent {
  type: string
  message: string
  timestamp: number
}

interface Props {
  events: TimelineEvent[]
}

const typeColors: Record<string, string> = {
  group_created: 'bg-blue-500',
  member_joined: 'bg-orange-500',
  threshold_reached: 'bg-green-500',
  report_generated: 'bg-purple-500',
}

function formatTime(ts: number) {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

export default function Timeline({ events }: Props) {
  if (!events || events.length === 0) return null

  return (
    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 mb-6">
      <h2 className="text-sm font-medium text-slate-400 mb-4">事件时间线</h2>
      <div className="space-y-3">
        {events.map((event, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-2.5 h-2.5 rounded-full ${typeColors[event.type] || 'bg-slate-500'} shrink-0 mt-1.5`} />
              {i < events.length - 1 && <div className="w-px h-full bg-slate-700 min-h-[16px]" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-300">{event.message}</p>
              <span className="text-xs text-slate-600">{formatTime(event.timestamp)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

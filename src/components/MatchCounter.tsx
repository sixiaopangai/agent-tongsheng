'use client'

import { useState, useEffect } from 'react'

interface Props {
  groupId: string
  initialCount: number
}

export default function MatchCounter({ groupId, initialCount }: Props) {
  const [count, setCount] = useState(initialCount)

  useEffect(() => {
    // Try Pusher first, fallback to polling
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_PUSHER_KEY) {
      import('pusher-js').then(({ default: Pusher }) => {
        const client = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        })
        const channel = client.subscribe(`group-${groupId}`)
        channel.bind('member-joined', (data: { count: number }) => {
          setCount(data.count)
        })
        return () => { client.unsubscribe(`group-${groupId}`) }
      })
    } else {
      // Polling fallback
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/groups/${groupId}`)
          const data = await res.json()
          if (data?.code === 0) setCount(data.data.count)
        } catch {}
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [groupId])

  return (
    <div className="text-center">
      <div className="text-5xl font-bold text-orange-400 tabular-nums">{count}</div>
      <div className="text-slate-500 text-sm mt-1">同命人</div>
    </div>
  )
}

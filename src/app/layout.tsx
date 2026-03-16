import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Agent同声 - AI 驱动的消费者集体行动平台',
  description: '让 AI 分身自动找到同命人，聚合投诉，生成集体报告',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  )
}

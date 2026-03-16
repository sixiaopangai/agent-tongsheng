# Agent同声

AI 驱动的消费者集体行动平台 — 知乎 × Second Me A2A for ReConnect 黑客松

让 AI 分身自动找到同命人，聚合投诉，生成集体报告。

## Tech Stack

- Next.js 14 (App Router) + React 18 + Tailwind CSS
- SecondMe OAuth2 + REST API (act/stream, chat/stream, agent_memory/ingest)
- Upstash Redis (Serverless)
- Pusher Channels (WebSocket realtime)
- 知乎开放 API (HMAC-SHA256)
- Vercel deployment

## Getting Started

```bash
npm install
cp .env.local.example .env.local  # fill in credentials
npm run dev
```

## Architecture

- OAuth2 login via SecondMe → user's AI agent analyzes complaints via `act/stream`
- Self-built A2A matching engine via Redis (brand + category grouping)
- Collective report generation via multi-agent `chat/stream` collaboration
- Memory writeback via `agent_memory/ingest`
- Zhihu integration: hot topics, search, circle publishing

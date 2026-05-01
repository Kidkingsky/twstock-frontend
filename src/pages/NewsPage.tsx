import { useState } from 'react'
import clsx from 'clsx'
import { Newspaper, TrendingUp, TrendingDown, Minus, RefreshCw, ExternalLink } from 'lucide-react'
import { useNewsSentiment } from '../hooks/useValuation'

const QUERIES = [
  { label: '台股大盤', q: '台股 股市 大盤' },
  { label: '半導體', q: '台灣 半導體 晶片' },
  { label: 'AI概念股', q: '台灣 AI 人工智慧 股票' },
  { label: '外資動向', q: '外資 台股 買超 賣超' },
]

function MoodIcon({ mood }: { mood: 'bullish' | 'bearish' | 'neutral' }) {
  if (mood === 'bullish')  return <TrendingUp  size={18} className="text-tv-up" />
  if (mood === 'bearish')  return <TrendingDown size={18} className="text-tv-down" />
  return <Minus size={18} className="text-tv-muted" />
}

function SentimentBadge({ s }: { s: 'positive' | 'negative' | 'neutral' | string }) {
  const map: Record<string, { label: string; cls: string }> = {
    positive: { label: '看多', cls: 'bg-tv-up/15 text-tv-up' },
    negative: { label: '看空', cls: 'bg-tv-down/15 text-tv-down' },
    neutral:  { label: '中立', cls: 'bg-tv-border text-tv-muted' },
  }
  const { label, cls } = map[s] ?? map['neutral']
  return (
    <span className={clsx('text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0', cls)}>
      {label}
    </span>
  )
}

function ScoreBar({ score, sentiment }: { score: number; sentiment: string }) {
  const color = sentiment === 'positive' ? '#26a69a' : sentiment === 'negative' ? '#ef5350' : '#787b86'
  return (
    <div className="w-12 h-1 bg-tv-border rounded-full overflow-hidden shrink-0">
      <div className="h-full rounded-full" style={{ width: `${score * 100}%`, backgroundColor: color }} />
    </div>
  )
}

export default function NewsPage() {
  const [queryIdx, setQueryIdx] = useState(0)
  const { q: query } = QUERIES[queryIdx]

  const { data, isLoading, refetch, isFetching } = useNewsSentiment(query, 15)

  const mood = data?.market_mood ?? 'neutral'
  const counts = data?.sentiment_summary ?? { positive: 0, negative: 0, neutral: 0 }
  const total  = counts.positive + counts.negative + counts.neutral || 1

  const moodLabel = { bullish: '偏多', bearish: '偏空', neutral: '中性' }[mood]
  const moodColor = mood === 'bullish' ? 'text-tv-up' : mood === 'bearish' ? 'text-tv-down' : 'text-tv-muted'

  return (
    <div className="flex flex-col h-full gap-3">
      {/* ── 標頭 ── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Newspaper size={15} className="text-tv-accent" />
          <h2 className="text-sm font-semibold text-tv-text">新聞情緒分析</h2>
          {data && (
            <span className={clsx('text-[11px] font-semibold', moodColor)}>
              市場：{moodLabel}
            </span>
          )}
          {data && !data.groq_enabled && (
            <span className="text-[10px] text-tv-warn bg-tv-warn/10 px-1.5 py-0.5 rounded">
              未設定 GROQ_API_KEY，情緒判斷停用
            </span>
          )}
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1 text-[11px] text-tv-muted hover:text-tv-text transition-colors disabled:opacity-50"
        >
          <RefreshCw size={11} className={isFetching ? 'animate-spin' : ''} />
          更新
        </button>
      </div>

      {/* ── 主題快選 ── */}
      <div className="flex gap-1.5 flex-wrap">
        {QUERIES.map((q, i) => (
          <button
            key={q.label}
            onClick={() => setQueryIdx(i)}
            className={clsx(
              'text-[11px] px-3 py-1 rounded transition-colors',
              queryIdx === i
                ? 'bg-tv-accent text-white'
                : 'text-tv-muted bg-tv-border hover:text-tv-text'
            )}
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* ── 情緒摘要 ── */}
      {!isLoading && data && (
        <div className="tv-card p-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <MoodIcon mood={mood} />
              <span className={clsx('text-sm font-bold', moodColor)}>{moodLabel}</span>
            </div>
            <div className="flex gap-4 text-[11px]">
              <span><span className="text-tv-up font-mono font-bold">{counts.positive}</span> 看多</span>
              <span><span className="text-tv-down font-mono font-bold">{counts.negative}</span> 看空</span>
              <span><span className="text-tv-muted font-mono font-bold">{counts.neutral}</span> 中立</span>
            </div>
            {/* 比例條 */}
            <div className="flex h-2 rounded-full overflow-hidden flex-1 min-w-[120px] bg-tv-border">
              <div className="bg-tv-up"   style={{ width: `${counts.positive / total * 100}%` }} />
              <div className="bg-tv-down" style={{ width: `${counts.negative / total * 100}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* ── 新聞列表 ── */}
      <div className="tv-card flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex gap-2">
                <div className="skeleton h-4 w-10 rounded shrink-0" />
                <div className="skeleton h-4 flex-1 rounded" />
              </div>
            ))}
          </div>
        ) : !data?.news?.length ? (
          <div className="flex items-center justify-center h-32 text-tv-muted text-sm">
            無法取得新聞（請確認網路連線）
          </div>
        ) : (
          <div className="divide-y divide-tv-border/30">
            {data.news.map((item, i) => (
              <div key={i} className="flex items-start gap-3 px-3 py-2.5 hover:bg-tv-border/20 transition-colors">
                <SentimentBadge s={item.sentiment} />
                <div className="flex-1 min-w-0">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[12px] text-tv-text hover:text-tv-accent leading-snug line-clamp-2 transition-colors"
                  >
                    {item.title}
                  </a>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-tv-muted">{item.published?.slice(0, 16)}</span>
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] text-tv-muted hover:text-tv-accent flex items-center gap-0.5">
                        <ExternalLink size={9} />連結
                      </a>
                    )}
                  </div>
                </div>
                <ScoreBar score={item.sentiment_score} sentiment={item.sentiment} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 說明 */}
      <p className="text-[10px] text-tv-muted">
        資料來源：Google News RSS．情緒分析：{data?.groq_enabled ? 'Groq LLaMA-3.1' : '未啟用（需設定 GROQ_API_KEY 環境變數）'}
      </p>
    </div>
  )
}

// Summary / Market Overview
export interface TaiexInfo {
  close: number
  change_pct: number
  volume: number
  time: string
}

export interface SignalCounts {
  bullish: number
  rebound: number
  total: number
}

export interface SummaryResponse {
  date: string
  market_open: boolean
  market_condition: 'bull' | 'neutral' | 'bear'
  signals: SignalCounts
  taiex: TaiexInfo
}

// Signals
export interface SignalStock {
  stock_id: string
  stock_name: string
  industry: string
  close: number
  ma20: number
  ma60: number
  dif: number
  dea: number
  macd_bar: number
  k_value: number
  d_value: number
  rsi14: number
  volume: number
}

// Hot Stocks
export interface HotStock {
  stock_id: string
  stock_name: string
  industry: string
  close: number
  open: number
  high: number
  low: number
  volume: number
  change_pct: number
  rsi14: number
  k_value: number
  d_value: number
  macd_bar: number
  signal_bullish: boolean
  signal_rebound: boolean
}

// Institutional
export interface InstitutionalStock {
  stock_id: string
  stock_name: string
  foreign_net: number
  investment_trust_net: number
  dealer_net: number
  total_net: number
  close: number
  change_pct: number
}

// Stock Detail
export interface StockInfo {
  stock_id: string
  stock_name: string
  market: string
  industry: string
}

export interface RealtimeQuote {
  price: number
  open: number
  high: number
  low: number
  volume: number
  yesterday: number
  change: number
  change_pct: number
  time: string
}

export interface KlineBar {
  trade_date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  ma5: number
  ma10: number
  ma20: number
  ma60: number
  dif: number
  dea: number
  macd_bar: number
  k_value: number
  d_value: number
  rsi14: number
}

export interface ChipData {
  trade_date: string
  foreign_net: number
  investment_trust_net: number
  dealer_net: number
  total_net: number
}

export interface RevenueData {
  revenue_year: number
  revenue_month: number
  revenue: number
  revenue_yoy: number
}

export interface StockValuation {
  per: number | null
  pbr: number | null
  dividend_yield: number | null
}

export interface StockDetailResponse {
  info: StockInfo
  realtime: RealtimeQuote
  kline: KlineBar[]
  chip: ChipData[]
  revenue: RevenueData[]
  valuation: StockValuation | null
}

// Valuation list
export interface ValuationStock {
  stock_id: string
  stock_name: string
  industry: string | null
  per: number | null
  pbr: number | null
  dividend_yield: number | null
  close: number | null
  volume: number | null
  updated_at: string | null
}

// Chip Clean
export interface ChipCleanStock {
  stock_id: string
  stock_name: string
  industry: string
  close: number
  first_close: number
  first_margin: number
  last_margin: number
  margin_chg_pct: number
  price_chg_pct: number
}

// News Sentiment
export interface NewsItem {
  title: string
  url: string
  published: string
  sentiment: 'positive' | 'negative' | 'neutral'
  sentiment_score: number
}

export interface NewsSentimentResponse {
  market_mood: 'bullish' | 'bearish' | 'neutral'
  sentiment_summary: { positive: number; negative: number; neutral: number }
  news: NewsItem[]
  groq_enabled: boolean
}

// Search
export interface SearchResult {
  stock_id: string
  stock_name: string
  market: string
  industry: string
}

// Margin Alert
export interface MarginAlert {
  stock_id: string
  stock_name: string
  close: number
  margin_balance: number
  prev_balance: number
  margin_change: number
  change_pct: number
}

// Five Star
export interface FiveStarStock {
  stock_id: string
  stock_name: string
  industry: string
  close: number
  volume: number
  ma20: number
  ma60: number
  dif: number
  dea: number
  macd_bar: number
  k_value: number
  rsi14: number
  foreign_net: number
  investment_trust_net: number
  total_net: number
}

// Strategy
export interface StrategyNotesA {
  foreign_net: number
  investment_trust_net: number
  macd_bar: number
  rsi14: number
}

export interface StrategyNotesB {
  short_balance: number
  short_change: number
  foreign_net: number
  ma20: number
}

export interface StrategyNotesC {
  revenue_yoy: number
  revenue_mom: number
  investment_trust_net: number
  foreign_net: number
}

export interface StrategyNotesD {
  volume: number
  avg_vol_20: number
  rsi14: number
  change_pct: number
}

export interface StrategyNotesE {
  k_value: number
  d_value: number
  rsi14: number
  rsi6: number
}

export interface StrategyNotesF {
  eps_yoy_pct: number
  gross_margin: number
  foreign_net: number
  investment_trust_net: number
}

export type StrategyNotes =
  | StrategyNotesA
  | StrategyNotesB
  | StrategyNotesC
  | StrategyNotesD
  | StrategyNotesE
  | StrategyNotesF

export interface StrategyStock {
  stock_id: string
  stock_name: string
  score: number
  close: number
  volume: number
  notes: StrategyNotes
}

// Revenue Alert
export interface RevenueAlertStock {
  stock_id: string
  stock_name: string
  industry: string
  revenue: number
  revenue_yoy: number
  revenue_mom: number
  revenue_year: number
  revenue_month: number
  close: number
  change_pct: number
  investment_trust_net: number
  foreign_net: number
}

// Short Squeeze
export interface ShortSqueezeStock {
  stock_id: string
  stock_name: string
  industry: string
  close: number
  change_pct: number
  short_balance: number
  short_change: number
  margin_balance: number
  foreign_net: number
  total_net: number
  ma20: number
  signal_bullish: boolean
}

// Gov Bank
export interface GovBankStock {
  stock_id: string
  stock_name: string
  industry: string
  close: number
  change_pct: number
  gov_net_5d: number
  trading_days: number
  volume: number
  signal_bullish: boolean
}

// Multi Signal
export interface MultiSignalStock {
  stock_id: string
  stock_name: string
  signal_count: number
  strategies: string[]
  close: number
  volume: number
  change_pct: number
}

// Broker Top
export interface BrokerTopStock {
  stock_id: string
  stock_name: string
  broker_id: string
  broker_name: string
  net_buy: number
  total_buy: number
  days_bought: number
  close: number
  change_pct: number
}

// Prediction Score
export type PredictionSignal = 'STRONG_BUY' | 'BUY' | 'WATCH' | 'ACCUMULATING' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL'

export interface PredictionStock {
  stock_id: string
  stock_name: string
  industry: string
  // 層一：標的品質分
  total_score: number
  // 層二：進場時機分
  timing_score: number
  // 層三：蓄積分
  score_accumulate: number
  signal: PredictionSignal
  score_tech: number
  score_chip: number
  score_fund: number
  score_macro: number
  score_momentum: number
  details: {
    close: number
    change_pct: number
    vol_ratio: number
    foreign_net: number
    trust_net: number
    revenue_yoy: number
    rsi14: number
    k_value: number
    price_5d_chg: number
    price_20d_chg: number
    dev_ma20: number
    margin_change: number
    timing_score: number
    timing_warns: string[]
    // 蓄積相關
    foreign_net_5d?: number
    trust_net_5d?: number
    foreign_buy_days?: number
    trust_buy_days?: number
    vol_trend_ratio?: number
  }
  close: number
  volume: number
  change_pct: number
}

export interface MacroIndicators {
  trade_date: string
  sp500: number | null
  sp500_chg: number | null
  nasdaq: number | null
  nasdaq_chg: number | null
  sox: number | null
  sox_chg: number | null
  vix: number | null
  dxy: number | null
  dxy_chg: number | null
  usd_twd: number | null
  usd_twd_chg: number | null
  us10y: number | null
  us10y_chg: number | null
  crude_oil: number | null
  crude_oil_chg: number | null
  gold: number | null
  gold_chg: number | null
  market_mood: string
  mood_color: 'bull' | 'neutral' | 'bear'
}

// Backtest
export interface BacktestTrade {
  stock_id: string
  stock_name: string
  signal_date: string
  entry_date: string
  entry_price: number
  exit_date: string
  exit_price: number
  return_pct: number
  win: boolean
}

export interface BacktestResponse {
  strategy: string
  hold_days: number
  start_date: string
  end_date: string
  total_signals: number
  completed_trades: number
  win_rate: number
  avg_return: number
  median_return: number
  max_win: number
  max_loss: number
  profit_factor: number
  trades: BacktestTrade[]
}

// Financials
export interface FinancialQuarter {
  year: number
  quarter: number
  revenue: number
  gross_profit: number
  operating_income: number
  net_income: number
  eps: number
  gross_margin: number
  op_margin: number
}

// Live Quotes
export interface LiveQuote {
  stock_id: string
  name: string
  price: number
  open: number
  high: number
  low: number
  volume: number
  yesterday: number
  change: number
  change_pct: number
  time: string
}

export type LiveQuotesResponse = Record<string, LiveQuote>

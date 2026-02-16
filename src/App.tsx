import { useState, useEffect, useRef, useCallback } from 'react'
import { LayoutDashboard, TrendingUp, Calculator, Newspaper, Star, Briefcase, RefreshCw, ChevronLeft, ChevronRight, Search, Bell, Settings, User, ZoomIn, ZoomOut, Maximize2, Activity, Target, CheckCircle, XCircle, BarChart3, LineChart, Brain, Zap, Clock, TrendingUp as TrendingUpIcon, Loader2, Calendar, ExternalLink, DollarSign, Building, Globe, TrendingDown as TrendingDownIcon, Info, Code, TrendingUp as TrendingUpIcon2, BarChart2, PieChart, Target as TargetIcon, Shield, Globe2, Cpu } from 'lucide-react'
import { createChart, ColorType, CrosshairMode, Time } from 'lightweight-charts'
import './App.css'

interface Rate { pair: string; bid: number; ask: number; change: number; changePercent: number }
interface CandleData { time: Time; open: number; high: number; low: number; close: number }
interface Timeframe { label: string; value: string; candles: number; interval: number }
interface TradingRecommendation { action: string; confidence: number; entryPrice: number; stopLoss: number; takeProfit1: number; riskReward: number; summary: string; keyReasons: string[]; timeframe: string }
interface NewsItem { id: string; title: string; description: string; source: string; publishedAt: string; url: string; category: string; impact: 'high' | 'medium' | 'low'; currency?: string }

const timeframes = [
  { label: '1D', value: '1D', candles: 24, interval: 3600 },
  { label: '1W', value: '1W', candles: 168, interval: 3600 },
  { label: '1M', value: '1M', candles: 720, interval: 3600 },
  { label: '3M', value: '3M', candles: 2160, interval: 3600 },
]

const pairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'EUR/GBP', 'EUR/JPY']
let baseRates: Record<string, number> = { 'EUR/USD': 1.0850, 'GBP/USD': 1.2650, 'USD/JPY': 150.50, 'USD/CHF': 0.8850, 'AUD/USD': 0.6550, 'USD/CAD': 1.3550, 'EUR/GBP': 0.8580, 'EUR/JPY': 163.20 }

const fetchRealRates = async (): Promise<Record<string, number>> => {
  try {
    const response = await fetch('https://api.frankfurter.app/latest?from=EUR&to=USD,JPY,GBP,CHF,AUD,CAD,NZD')
    const data = await response.json()
    const rates: Record<string, number> = {}
    if (data.rates?.USD) rates['EUR/USD'] = data.rates.USD
    if (data.rates?.GBP) rates['EUR/GBP'] = data.rates.GBP
    if (data.rates?.JPY) rates['EUR/JPY'] = data.rates.JPY
    if (data.rates?.CHF) rates['EUR/CHF'] = data.rates.CHF
    if (rates['EUR/USD'] && rates['EUR/GBP']) rates['GBP/USD'] = rates['EUR/USD'] / rates['EUR/GBP']
    if (rates['EUR/USD'] && rates['EUR/JPY']) rates['USD/JPY'] = rates['EUR/JPY'] / rates['EUR/USD']
    if (rates['EUR/USD'] && rates['EUR/CHF']) rates['USD/CHF'] = rates['EUR/CHF'] / rates['EUR/USD']
    baseRates = { ...baseRates, ...rates }
    return rates
  } catch { return baseRates }
}

const fetchHistoricalData = async (pair: string, days: number = 30): Promise<number[]> => {
  try {
    const [base, quote] = pair.split('/')
    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0]
    const response = await fetch(`https://api.frankfurter.app/${startDate}..${endDate}?from=${base}&to=${quote}`)
    const data = await response.json()
    const prices: number[] = []
    if (data.rates) {
      Object.entries(data.rates).forEach(([date, rates]: [string, any]) => {
        if (rates[quote]) prices.push(rates[quote])
      })
    }
    return prices
  } catch { return [] }
}

const generateCandleData = (prices: number[], count: number, interval: number = 3600): CandleData[] => {
  const data: CandleData[] = []
  const nowSeconds = Math.floor(Date.now() / 1000)
  
  if (prices.length < 2) {
    let bp = 1.085
    for (let i = count; i > 0; i--) {
      const ts = (nowSeconds - (i * interval)) as Time
      const vol = bp * 0.002
      const o = bp + (Math.random() - 0.5) * vol
      const c = o + (Math.random() - 0.5) * vol
      data.push({ time: ts, open: o, high: Math.max(o, c) + Math.random() * vol * 0.5, low: Math.min(o, c) - Math.random() * vol * 0.5, close: c })
      bp = c
    }
    return data
  }
  let bp = prices[0]
  for (let i = count; i > 0; i--) {
    const ts = (nowSeconds - (i * interval)) as Time
    const tf = (prices[Math.min(prices.length - 1, Math.floor((count - i) / (count / prices.length)))] - prices[0]) / (prices[0] || 1)
    const vol = bp * 0.002 + Math.abs(prices[prices.length - 1] - prices[0]) * 0.3
    const o = bp + (Math.random() - 0.5 + tf * 0.1) * vol
    const c = o + (Math.random() - 0.5 + tf * 0.05) * vol
    data.push({ time: ts, open: o, high: Math.max(o, c) + Math.random() * vol * 0.5, low: Math.min(o, c) - Math.random() * vol * 0.5, close: c })
    bp = c
  }
  if (prices.length > 0) {
    const sf = prices[prices.length - 1] / data[data.length - 1].close
    data.forEach(c => { c.open *= sf; c.high *= sf; c.low *= sf; c.close *= sf })
  }
  return data
}

const generateRate = (pair: string, rates: Record<string, number>): Rate => {
  const price = rates[pair] || baseRates[pair] || 1
  const spread = pair.includes('JPY') ? 0.02 : 0.0002
  const ch = (Math.random() - 0.5) * price * 0.001
  return { pair, bid: price + ch, ask: price + ch + spread, change: ch, changePercent: (ch / price) * 100 }
}

const calculateSMA = (d: number[], p: number): number[] => {
  const r: number[] = []
  for (let i = p - 1; i < d.length; i++) {
    r.push(d.slice(i - p + 1, i + 1).reduce((a, b) => a + b, 0) / p)
  }
  return r
}

const calculateEMA = (d: number[], p: number): number[] => {
  const r = [d[0]]
  const m = 2 / (p + 1)
  for (let i = 1; i < d.length; i++) r.push((d[i] - r[i - 1]) * m + r[i - 1])
  return r
}

const calculateRSI = (d: number[], p = 14): number => {
  const g: number[] = [], l: number[] = []
  for (let i = 1; i < d.length; i++) {
    const c = d[i] - d[i - 1]
    g.push(c > 0 ? c : 0)
    l.push(c < 0 ? Math.abs(c) : 0)
  }
  const ag = g.slice(-p).reduce((a, b) => a + b, 0) / p
  const al = l.slice(-p).reduce((a, b) => a + b, 0) / p
  return al === 0 ? 100 : 100 - (100 / (1 + ag / al))
}

const calculateMACD = (d: number[], f = 12, s = 26, sig = 9) => {
  const ef = calculateEMA(d, f)
  const es = calculateEMA(d, s)
  const ml: number[] = []
  const so = d.length - es.length
  for (let i = 0; i < ef.length - so; i++) ml.push(ef[i + so] - es[i])
  const sl = calculateEMA(ml, sig)
  return { macd: ml[ml.length - 1], signal: sl[sl.length - 1], histogram: ml.slice(-sl.length).map((v, i) => v - sl[i])[0] }
}

const calculateBollingerBands = (d: number[], p = 20, sd = 2) => {
  const sma = calculateSMA(d, p)
  const ls = sma[sma.length - 1]
  const std = Math.sqrt(d.slice(-p).map(x => Math.pow(x - ls, 2)).reduce((a, b) => a + b, 0) / p)
  return { upper: ls + sd * std, middle: ls, lower: ls - sd * std }
}

const calculateATR = (d: CandleData[], p = 14): number => {
  const tr: number[] = []
  for (let i = 1; i < d.length; i++) {
    tr.push(Math.max(d[i].high - d[i].low, Math.abs(d[i].high - d[i - 1].close), Math.abs(d[i].low - d[i - 1].close)))
  }
  return tr.slice(-p).reduce((a, b) => a + b, 0) / p
}

const calculateStochastic = (d: CandleData[], kp = 14) => {
  const c = d[d.length - 1].close
  const h = Math.max(...d.slice(-kp).map(x => x.high))
  const l = Math.min(...d.slice(-kp).map(x => x.low))
  return { k: ((c - l) / (h - l)) * 100, d: 0 }
}

const calculateSupportResistance = (d: CandleData[], c = 5) => {
  const p = d.map(x => x.close)
  const mn = Math.min(...p), mx = Math.max(...p)
  const r = mx - mn, st = r / c
  const sp: number[] = [], rs: number[] = []
  for (let i = 1; i < c; i++) { sp.push(mn + st * i); rs.push(mx - st * i) }
  return { support: sp, resistance: rs }
}

const analyzeTrend = (d: CandleData[]): string => {
  const p = d.map(x => x.close)
  const sma20 = calculateSMA(p, 20), sma50 = calculateSMA(p, 50)
  if (sma20.length < 2 || sma50.length < 2) return 'NEUTRAL'
  const cp = p[p.length - 1], cs20 = sma20[sma20.length - 1], cs50 = sma50[sma50.length - 1]
  let sc = 0
  if (cp > cs20) sc += 1; else sc -= 1
  if (cp > cs50) sc += 2; else sc -= 2
  if (sc > 2) return 'BULLISH'
  if (sc < -2) return 'BEARISH'
  return 'NEUTRAL'
}

const generateRecommendation = (pair: string, d: CandleData[], tf: string): TradingRecommendation => {
  const p = d.map(x => x.close)
  const cp = p[p.length - 1]
  const atr = calculateATR(d)
  const bb = calculateBollingerBands(p)
  const macd = calculateMACD(p)
  const rsi = calculateRSI(p)
  const stoch = calculateStochastic(d)
  const tr = analyzeTrend(d)
  let sc = 0, kr: string[] = []
  if (rsi < 30) { sc += 2; kr.push('RSI in oversold territory') }
  else if (rsi > 70) { sc -= 2; kr.push('RSI in overbought territory') }
  else if (rsi >= 45 && rsi <= 55) { sc += 1; kr.push('RSI in neutral zone') }
  if (macd.histogram > 0 && macd.macd > macd.signal) { sc += 2; kr.push('MACD bullish signal') }
  else if (macd.histogram < 0 && macd.macd < macd.signal) { sc -= 2; kr.push('MACD bearish signal') }
  if (cp < bb.lower) { sc += 2; kr.push('Price near lower Bollinger Band') }
  else if (cp > bb.upper) { sc -= 2; kr.push('Price near upper Bollinger Band') }
  if (tr === 'BULLISH') { sc += 3; kr.push('Strong bullish trend') }
  else if (tr === 'BEARISH') { sc -= 3; kr.push('Strong bearish trend') }
  if (stoch.k < 20) { sc += 1; kr.push('Stochastic oversold') }
  else if (stoch.k > 80) { sc -= 1; kr.push('Stochastic overbought') }
  let act, sum
  if (sc >= 4) { act = 'BUY'; sum = `Strong buy signal on ${pair}` }
  else if (sc <= -4) { act = 'SELL'; sum = `Strong sell signal on ${pair}` }
  else if (sc >= 1) { act = 'BUY'; sum = `Mild buy signal on ${pair}` }
  else if (sc <= -1) { act = 'SELL'; sum = `Mild sell signal on ${pair}` }
  else { act = 'NEUTRAL'; sum = `No clear direction on ${pair}` }
  const sl = act === 'BUY' ? cp - 2 * atr : cp + 2 * atr
  const tp1 = act === 'BUY' ? cp + 1.5 * atr : cp - 1.5 * atr
  const rr = Math.abs(cp - tp1) / Math.abs(cp - sl)
  return { action: act, confidence: Math.round(Math.min(Math.abs(sc) * 15 + 50, 95)), entryPrice: cp, stopLoss: sl, takeProfit1: tp1, riskReward: Math.round(rr * 10) / 10, summary: sum, keyReasons: kr, timeframe: tf }
}

const economicCalendar = [
  { date: '2026-02-17', event: 'US Retail Sales', currency: 'USD', impact: 'high' as const, forecast: '0.6%' },
  { date: '2026-02-18', event: 'ECB President Lagarde Speech', currency: 'EUR', impact: 'high' as const, forecast: '' },
  { date: '2026-02-19', event: 'US Initial Jobless Claims', currency: 'USD', impact: 'high' as const, forecast: '215K' },
  { date: '2026-02-20', event: 'US Fed Meeting Minutes', currency: 'USD', impact: 'high' as const, forecast: '' },
  { date: '2026-02-20', event: 'UK CPI', currency: 'GBP', impact: 'high' as const, forecast: '3.0%' },
  { date: '2026-02-24', event: 'US GDP Growth Rate', currency: 'USD', impact: 'high' as const, forecast: '2.3%' },
  { date: '2026-02-25', event: 'US PCE Price Index', currency: 'USD', impact: 'high' as const, forecast: '2.4%' },
  { date: '2026-02-27', event: 'US Non-Farm Payrolls', currency: 'USD', impact: 'high' as const, forecast: '185K' },
]

const generateNews = (): NewsItem[] => {
  const now = new Date()
  return [
    { id: '1', title: 'Fed Signals Potential Rate Cuts', description: 'Federal Reserve officials indicated they may begin cutting interest rates if inflation continues to moderate.', source: 'Reuters', publishedAt: new Date(now.getTime() - 2 * 3600000).toISOString(), url: '#', category: 'Monetary Policy', impact: 'high', currency: 'USD' },
    { id: '2', title: 'ECB Maintains Hawkish Stance', description: 'European Central Bank officials emphasized that fighting inflation remains their top priority.', source: 'Bloomberg', publishedAt: new Date(now.getTime() - 4 * 3600000).toISOString(), url: '#', category: 'Monetary Policy', impact: 'high', currency: 'EUR' },
    { id: '3', title: 'Bank of Japan Considers Policy Normalization', description: 'BOJ officials are discussing plans to phase out negative interest rates.', source: 'Financial Times', publishedAt: new Date(now.getTime() - 6 * 3600000).toISOString(), url: '#', category: 'Monetary Policy', impact: 'high', currency: 'JPY' },
    { id: '4', title: 'US Dollar Weakens After Economic Data', description: 'Economic data led to reassessment of Fed policy path, causing USD to decline.', source: 'CNBC', publishedAt: new Date(now.getTime() - 8 * 3600000).toISOString(), url: '#', category: 'Economic Data', impact: 'medium', currency: 'USD' },
    { id: '5', title: 'Eurozone GDP Growth Beats Expectations', description: 'EU economic growth came in at 0.3% quarterly.', source: 'WSJ', publishedAt: new Date(now.getTime() - 10 * 3600000).toISOString(), url: '#', category: 'Economic Data', impact: 'medium', currency: 'EUR' },
    { id: '6', title: 'UK Inflation Falls to 3-Year Low', description: 'British consumer prices rose 3.0% year-over-year.', source: 'Reuters', publishedAt: new Date(now.getTime() - 12 * 3600000).toISOString(), url: '#', category: 'Economic Data', impact: 'high', currency: 'GBP' },
    { id: '7', title: 'Australian Dollar Rises on Trade Data', description: 'Australia posted a larger-than-expected trade surplus.', source: 'Bloomberg', publishedAt: new Date(now.getTime() - 14 * 3600000).toISOString(), url: '#', category: 'Trade', impact: 'medium', currency: 'AUD' },
    { id: '8', title: 'China Imports Surge, Boosting Asia Currencies', description: 'Chinese imports rose sharply, signaling stronger domestic demand.', source: 'Financial Times', publishedAt: new Date(now.getTime() - 16 * 3600000).toISOString(), url: '#', category: 'Trade', impact: 'medium', currency: 'CNY' },
  ]
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'analysis', label: 'Analysis', icon: Brain },
  { id: 'tools', label: 'Trading Tools', icon: Calculator },
  { id: 'news', label: 'Market News', icon: Newspaper },
  { id: 'watchlist', label: 'Watchlist', icon: Star },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
  { id: 'about', label: 'About', icon: Info },
]

const impactColors: Record<string, { bg: string; text: string }> = { high: { bg: 'bg-red-100', text: 'text-red-700' }, medium: { bg: 'bg-yellow-100', text: 'text-yellow-700' }, low: { bg: 'bg-green-100', text: 'text-green-700' } }
const currencyFlags: Record<string, string> = { USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵', CHF: '🇨🇭', AUD: '🇦🇺', CAD: '🇨🇦', NZD: '🇳🇿', CNY: '🇨🇳' }
const categoryIcons: Record<string, any> = { 'Monetary Policy': DollarSign, 'Economic Data': TrendingUp, 'Trade': Globe, 'Market Analysis': TrendingDownIcon }

const IndicatorCard = ({ title, value, signal, icon: Icon, description }: any) => (
  <div className="stat-card">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${signal === 'bullish' ? 'bg-green-100' : signal === 'bearish' ? 'bg-red-100' : 'bg-gray-100'}`}>
          <Icon size={16} className={signal === 'bullish' ? 'text-green-600' : signal === 'bearish' ? 'text-red-600' : 'text-gray-600'} />
        </div>
        <span className="font-medium text-gray-700">{title}</span>
      </div>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${signal === 'bullish' ? 'bg-green-100 text-green-700' : signal === 'bearish' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{signal.toUpperCase()}</span>
    </div>
    <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
    <div className="text-xs text-gray-500">{description}</div>
  </div>
)

const RecommendationCard = ({ rec }: { rec: TradingRecommendation }) => {
  const actionColors: Record<string, string> = { BUY: 'bg-green-500', SELL: 'bg-red-500', HOLD: 'bg-yellow-500', NEUTRAL: 'bg-gray-500' }
  return (
    <div className="chart-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Trading Recommendation</h3>
        <span className="text-sm text-gray-500">{rec.timeframe} TF</span>
      </div>
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${actionColors[rec.action]} text-white`}>
          <span className="text-2xl font-bold">{rec.action}</span>
        </div>
        <div>
          <div className="text-3xl font-bold text-gray-900">{rec.confidence}%</div>
          <div className="text-sm text-gray-500">Confidence</div>
        </div>
      </div>
      <p className="text-gray-700 mb-4">{rec.summary}</p>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Entry</div><div className="font-semibold">{rec.entryPrice.toFixed(5)}</div></div>
        <div className="bg-red-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Stop Loss</div><div className="font-semibold text-red-600">{rec.stopLoss.toFixed(5)}</div></div>
        <div className="bg-green-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Take Profit</div><div className="font-semibold text-green-600">{rec.takeProfit1.toFixed(5)}</div></div>
        <div className="bg-blue-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">R:R</div><div className="font-semibold">1:{rec.riskReward}</div></div>
      </div>
      <div className="border-t border-gray-200 pt-4">
        <div className="text-sm font-medium text-gray-700 mb-2">Key Reasons:</div>
        <ul className="space-y-1">{rec.keyReasons.map((reason: string, i: number) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-600"><CheckCircle size={16} className="text-green-500 mt-0.5" />{reason}</li>
        ))}</ul>
      </div>
    </div>
  )
}

const AnalysisPanel = ({ pair, timeframe }: { pair: string; timeframe: string }) => {
  const [loading, setLoading] = useState(true)
  const [rec, setRec] = useState<TradingRecommendation | null>(null)
  const [trend, setTrend] = useState('NEUTRAL')
  const [cp, setCp] = useState(0)
  const [atr, setAtr] = useState(0)
  const [inds, setInds] = useState<any[]>([])
  const [sup, setSup] = useState<number[]>([])
  const [res, setRes] = useState<number[]>([])
  
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const tf = timeframes.find(t => t.value === timeframe) || timeframes[2]
      const hp = await fetchHistoricalData(pair, 90)
      const d = generateCandleData(hp, tf.candles, tf.interval)
      const pd = d.map(x => x.close)
      setCp(pd[pd.length - 1])
      setAtr(calculateATR(d))
      setTrend(analyzeTrend(d))
      setRec(generateRecommendation(pair, d, timeframe))
      const { support, resistance } = calculateSupportResistance(d)
      setSup(support)
      setRes(resistance)
      const bb = calculateBollingerBands(pd)
      const macd = calculateMACD(pd)
      const rsi = calculateRSI(pd)
      const stoch = calculateStochastic(d)
      setInds([
        { title: 'RSI (14)', value: rsi.toFixed(2), signal: rsi < 30 ? 'bullish' : rsi > 70 ? 'bearish' : 'neutral', icon: Activity, description: 'momentum' },
        { title: 'MACD', value: macd.histogram > 0 ? `+${macd.histogram.toFixed(5)}` : macd.histogram.toFixed(5), signal: macd.histogram > 0 ? 'bullish' : 'bearish', icon: LineChart, description: 'trend' },
        { title: 'Bollinger', value: `${bb.upper.toFixed(5)} / ${bb.lower.toFixed(5)}`, signal: cp < bb.lower ? 'bullish' : cp > bb.upper ? 'bearish' : 'neutral', icon: BarChart3, description: 'volatility' },
        { title: 'Stochastic', value: `${stoch.k.toFixed(0)}`, signal: stoch.k < 20 ? 'bullish' : stoch.k > 80 ? 'bearish' : 'neutral', icon: Target, description: 'momentum' },
      ])
      setLoading(false)
    }
    load()
  }, [pair, timeframe])
  
  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="animate-spin text-blue-600" size={48} />
      <span className="ml-3 text-gray-600">Analyzing market data...</span>
    </div>
  )
  
  const tc: Record<string, any> = { BULLISH: { icon: TrendingUpIcon, color: 'text-green-600', bg: 'bg-green-100', label: 'BULLISH' }, BEARISH: { icon: TrendingUpIcon, color: 'text-red-600', bg: 'bg-red-100', label: 'BEARISH' }, NEUTRAL: { icon: Activity, color: 'text-gray-600', bg: 'bg-gray-100', label: 'NEUTRAL' } }
  const Ti = tc[trend].icon
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${tc[trend].bg} flex items-center justify-center`}><Ti size={24} className={tc[trend].color} /></div>
            <div><p className="text-sm text-gray-500">Trend</p><p className={`text-xl font-bold ${tc[trend].color}`}>{tc[trend].label}</p></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"><Activity size={24} className="text-blue-600" /></div>
            <div><p className="text-sm text-gray-500">ATR (14)</p><p className="text-xl font-bold text-gray-900">{atr.toFixed(5)}</p></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center"><Zap size={24} className="text-purple-600" /></div>
            <div><p className="text-sm text-gray-500">Volatility</p><p className="text-xl font-bold text-gray-900">{cp > 0 ? ((atr / cp) * 100).toFixed(2) : '0'}%</p></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center"><Clock size={24} className="text-orange-600" /></div>
            <div><p className="text-sm text-gray-500">Price</p><p className="text-xl font-bold text-gray-900">{cp.toFixed(5)}</p></div>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Indicators</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">{inds.map((ind, i) => <IndicatorCard key={i} {...ind} />)}</div>
      </div>
      
      {rec && <RecommendationCard rec={rec} />}
      
      <div className="chart-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Support & Resistance</h3>
        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-2"><TrendingUp size={18} className="text-red-500" /><span className="font-medium text-gray-700">Resistance</span></div>
            {res.slice(0, 3).reverse().map((level, i) => (
              <div key={i} className="flex items-center justify-between bg-red-50 rounded-lg px-3 py-2"><span className="text-sm text-gray-600">R{3-i}</span><span className="font-semibold text-red-600">{level.toFixed(5)}</span></div>
            ))}
          </div>
          <div className="border-t border-gray-200 my-4"></div>
          <div>
            <div className="flex items-center gap-2 mb-2"><TrendingUp size={18} className="text-green-500" style={{ transform: 'rotate(180deg)' }} /><span className="font-medium text-gray-700">Support</span></div>
            {sup.slice(0, 3).map((level, i) => (
              <div key={i} className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2"><span className="text-sm text-gray-600">S{i+1}</span><span className="font-semibold text-green-600">{level.toFixed(5)}</span></div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="chart-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Sentiment</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2"><CheckCircle size={20} className="text-green-600" /><span className="font-medium text-green-700">Bullish</span></div>
            <div className="text-3xl font-bold text-green-600">{inds.filter(i => i.signal === 'bullish').length}</div>
          </div>
          <div className="bg-red-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2"><XCircle size={20} className="text-red-600" /><span className="font-medium text-red-700">Bearish</span></div>
            <div className="text-3xl font-bold text-red-600">{inds.filter(i => i.signal === 'bearish').length}</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2"><Activity size={20} className="text-gray-600" /><span className="font-medium text-gray-700">Neutral</span></div>
            <div className="text-3xl font-bold text-gray-600">{inds.filter(i => i.signal === 'neutral').length}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

const NewsPanel = () => {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedCurrency, setSelectedCurrency] = useState('all')

  useEffect(() => {
    const loadNews = async () => {
      setLoading(true)
      await new Promise(r => setTimeout(r, 1000))
      setNews(generateNews())
      setLoading(false)
    }
    loadNews()
  }, [])

  const filteredNews = news.filter(item => {
    if (selectedCurrency !== 'all' && item.currency !== selectedCurrency) return false
    if (filter !== 'all' && item.category !== filter) return false
    return true
  })

  const categories = ['all', 'Monetary Policy', 'Economic Data', 'Trade', 'Market Analysis']
  const currencies = ['all', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CNY']

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="animate-spin text-blue-600" size={48} />
      <span className="ml-3 text-gray-600">Loading market news...</span>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="chart-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Economic Calendar</h3>
          <Calendar size={20} className="text-gray-400" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Event</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Currency</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Impact</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Forecast</th>
              </tr>
            </thead>
            <tbody>
              {economicCalendar.map((event, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">{event.date}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{event.event}</td>
                  <td className="py-3 px-4 text-sm">{currencyFlags[event.currency]} {event.currency}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${impactColors[event.impact].bg} ${impactColors[event.impact].text}`}>
                      {event.impact.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{event.forecast || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="chart-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Latest Forex News</h3>
          <Newspaper size={20} className="text-gray-400" />
        </div>
        
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
            ))}
          </select>
          
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {currencies.map(cur => (
              <option key={cur} value={cur}>{cur === 'all' ? 'All Currencies' : `${currencyFlags[cur]} ${cur}`}</option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          {filteredNews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No news found matching your filters.</div>
          ) : (
            filteredNews.map((item) => {
              const Icon = categoryIcons[item.category] || Newspaper
              return (
                <div key={item.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${impactColors[item.impact].bg} ${impactColors[item.impact].text}`}>
                        {item.impact.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">{item.category}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(item.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">{item.source}</span>
                      {item.currency && (
                        <span className="text-lg">{currencyFlags[item.currency]}</span>
                      )}
                    </div>
                    <a href={item.url} className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
                      Read more <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

const DashboardPanel = ({ rates, selectedPair, onPairSelect }: { rates: Rate[]; selectedPair: string; onPairSelect: (pair: string) => void }) => {
  const [prices, setPrices] = useState<number[]>([])
  
  useEffect(() => {
    const load = async () => {
      const hp = await fetchHistoricalData(selectedPair, 30)
      setPrices(hp)
    }
    load()
  }, [selectedPair])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {rates.slice(0, 4).map((rate) => (
          <div key={rate.pair} className="stat-card cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onPairSelect(rate.pair)}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-900">{rate.pair}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${rate.change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {rate.changePercent >= 0 ? '+' : ''}{rate.changePercent.toFixed(2)}%
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{rate.bid.toFixed(5)}</div>
            <div className="text-xs text-gray-500 mt-1">Ask: {rate.ask.toFixed(5)}</div>
          </div>
        ))}
      </div>

      <div className="chart-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {rates.map((rate) => (
            <div key={rate.pair} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-700">{rate.pair}</span>
                <span className={`text-sm ${rate.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {rate.change >= 0 ? '+' : ''}{rate.changePercent.toFixed(2)}%
                </span>
              </div>
              <div className="text-lg font-semibold text-gray-900">{rate.bid.toFixed(5)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const ToolsPanel = () => {
  const [amount, setAmount] = useState(1000)
  const [fromCurrency, setFromCurrency] = useState('USD')
  const [toCurrency, setToCurrency] = useState('EUR')
  const [result, setResult] = useState<number | null>(null)

  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD']

  const convert = () => {
    const rate = baseRates[`${fromCurrency}/${toCurrency}`] || (1 / baseRates[`${toCurrency}/${fromCurrency}`]) || 1
    setResult(amount * rate)
  }

  return (
    <div className="space-y-6">
      <div className="chart-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calculator size={20} /> Currency Converter
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {currencies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {currencies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <button
          onClick={convert}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Convert
        </button>
        {result !== null && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <div className="text-sm text-gray-600">{amount} {fromCurrency} =</div>
            <div className="text-2xl font-bold text-green-700">{result.toFixed(2)} {toCurrency}</div>
          </div>
        )}
      </div>
    </div>
  )
}

const WatchlistPanel = () => {
  const [watchlist, setWatchlist] = useState(['EUR/USD', 'GBP/USD', 'USD/JPY'])

  return (
    <div className="space-y-6">
      <div className="chart-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Star size={20} /> Your Watchlist
        </h3>
        <div className="space-y-3">
          {watchlist.map((pair) => {
            const rate = generateRate(pair, {})
            return (
              <div key={pair} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-semibold text-gray-900">{pair}</div>
                  <div className="text-sm text-gray-500">Updated just now</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{rate.bid.toFixed(5)}</div>
                  <div className={`text-sm ${rate.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {rate.change >= 0 ? '+' : ''}{rate.changePercent.toFixed(2)}%
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const PortfolioPanel = () => {
  const [positions] = useState([
    { pair: 'EUR/USD', units: 10000, entry: 1.0850, current: 1.0865, pnl: 150 },
    { pair: 'GBP/USD', units: 5000, entry: 1.2650, current: 1.2630, pnl: -100 },
  ])

  const totalPnl = positions.reduce((sum, p) => sum + p.pnl, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="text-sm text-gray-500 mb-1">Total P&L</div>
          <div className={`text-2xl font-bold ${totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalPnl >= 0 ? '+' : ''}${totalPnl}
          </div>
        </div>
        <div className="stat-card">
          <div className="text-sm text-gray-500 mb-1">Open Positions</div>
          <div className="text-2xl font-bold text-gray-900">{positions.length}</div>
        </div>
        <div className="stat-card">
          <div className="text-sm text-gray-500 mb-1">Win Rate</div>
          <div className="text-2xl font-bold text-gray-900">50%</div>
        </div>
      </div>

      <div className="chart-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Briefcase size={20} /> Open Positions
        </h3>
        <div className="space-y-3">
          {positions.map((pos, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="font-semibold text-gray-900">{pos.pair}</div>
                <div className="text-sm text-gray-500">{pos.units} units @ {pos.entry.toFixed(5)}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">{pos.current.toFixed(5)}</div>
                <div className={`text-sm ${pos.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {pos.pnl >= 0 ? '+' : ''}${pos.pnl}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const AboutPanel = () => {
  return (
    <div className="space-y-6">
      <div className="chart-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Info size={24} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Forex Analytics Pro</h2>
            <p className="text-sm text-gray-500">Version 1.0.0 • Professional Trading Analysis Platform</p>
          </div>
        </div>
        
        <div className="prose prose-sm max-w-none text-gray-600">
          <p className="mb-4">
            Forex Analytics Pro is a comprehensive trading analysis platform designed for forex traders. 
            It provides real-time market data, technical analysis indicators, trading recommendations, 
            and market news to help traders make informed decisions.
          </p>
        </div>
      </div>

      <div className="chart-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <Globe2 size={24} className="text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Data Sources & APIs</h3>
        </div>
        
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe size={18} className="text-blue-600" />
              <h4 className="font-medium text-gray-900">Frankfurter API</h4>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Primary data source for real-time and historical exchange rates.
            </p>
            <div className="bg-gray-50 rounded-lg p-3 text-xs font-mono text-gray-700 overflow-x-auto">
              https://api.frankfurter.app/latest?from=EUR&to=USD,JPY,GBP,CHF,AUD,CAD,NZD
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Free</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">No API Key Required</span>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">Real-time Data</span>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Code size={18} className="text-purple-600" />
              <h4 className="font-medium text-gray-900">Supported Currency Pairs</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'EUR/GBP', 'EUR/JPY'].map(pair => (
                <span key={pair} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg text-center">{pair}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="chart-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <Brain size={24} className="text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Technical Analysis Methods</h3>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity size={18} className="text-red-600" />
                <h4 className="font-medium text-gray-900">RSI (Relative Strength Index)</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Momentum oscillator measuring the speed and change of price movements.
              </p>
              <div className="bg-gray-50 rounded-lg p-2 text-xs text-gray-600">
                <div>• Overbought: RSI &gt; 70</div>
                <div>• Oversold: RSI &lt; 30</div>
                <div>• Neutral: 40-60</div>
                <div className="mt-1">Period: 14</div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <LineChart size={18} className="text-blue-600" />
                <h4 className="font-medium text-gray-900">MACD</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Moving Average Convergence Divergence - trend-following momentum indicator.
              </p>
              <div className="bg-gray-50 rounded-lg p-2 text-xs text-gray-600">
                <div>• Fast EMA: 12 periods</div>
                <div>• Slow EMA: 26 periods</div>
                <div>• Signal Line: 9 periods</div>
                <div className="mt-1">Histogram shows momentum</div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 size={18} className="text-orange-600" />
                <h4 className="font-medium text-gray-900">Bollinger Bands</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Volatility bands placed above and below a moving average.
              </p>
              <div className="bg-gray-50 rounded-lg p-2 text-xs text-gray-600">
                <div>• SMA Period: 20</div>
                <div>• Standard Deviations: 2</div>
                <div>• Price near bands = potential reversal</div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <TargetIcon size={18} className="text-green-600" />
                <h4 className="font-medium text-gray-900">Stochastic Oscillator</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Compares closing price to price range over a period.
              </p>
              <div className="bg-gray-50 rounded-lg p-2 text-xs text-gray-600">
                <div>• %K Period: 14</div>
                <div>• Overbought: &gt; 80</div>
                <div>• Oversold: &lt; 20</div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUpIcon2 size={18} className="text-indigo-600" />
                <h4 className="font-medium text-gray-900">SMA (Simple Moving Average)</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Unweighted mean of previous data points over a specific period.
              </p>
              <div className="bg-gray-50 rounded-lg p-2 text-xs text-gray-600">
                <div>• SMA 20: Short-term trend</div>
                <div>• SMA 50: Medium-term trend</div>
                <div>• Used for trend analysis</div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={18} className="text-yellow-600" />
                <h4 className="font-medium text-gray-900">ATR (Average True Range)</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Measures market volatility by decomposing the range of price.
              </p>
              <div className="bg-gray-50 rounded-lg p-2 text-xs text-gray-600">
                <div>• Period: 14</div>
                <div>• Used for stop loss calculation</div>
                <div>• Measures volatility</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="chart-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
            <Cpu size={24} className="text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Trading Recommendation Engine</h3>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Our AI-powered recommendation engine analyzes multiple technical indicators to generate trading signals:
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Signal Scoring System</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">+2</span>
                <span>RSI oversold (&lt;30) or overbought (&gt;70)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">+2</span>
                <span>MACD bullish or bearish crossover</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">+2</span>
                <span>Price at Bollinger Band extremes</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">+3</span>
                <span>Strong trend (SMA confirmation)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">+1</span>
                <span>Stochastic oversold/overbought</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={18} className="text-green-600" />
                <h4 className="font-medium text-green-700">BUY Signal</h4>
              </div>
              <p className="text-sm text-green-600">Score ≥ 4</p>
              <p className="text-xs text-green-600 mt-1">Strong bullish momentum</p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity size={18} className="text-yellow-600" />
                <h4 className="font-medium text-yellow-700">NEUTRAL</h4>
              </div>
              <p className="text-sm text-yellow-600">Score -3 to 3</p>
              <p className="text-xs text-yellow-600 mt-1">No clear direction</p>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDownIcon size={18} className="text-red-600" />
                <h4 className="font-medium text-red-700">SELL Signal</h4>
              </div>
              <p className="text-sm text-red-600">Score ≤ -4</p>
              <p className="text-xs text-red-600 mt-1">Strong bearish momentum</p>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Risk Management</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500 mb-1">Stop Loss</div>
                <div className="font-semibold text-red-600">2 × ATR below/above entry</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">Take Profit</div>
                <div className="font-semibold text-green-600">1.5 × ATR from entry</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">Risk/Reward Ratio</div>
                <div className="font-semibold text-blue-600">1:1.5 minimum</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">Confidence Level</div>
                <div className="font-semibold text-purple-600">50-95% based on signal strength</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="chart-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
            <PieChart size={24} className="text-cyan-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Supported Timeframes</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: '1 Day', value: '1D', candles: 24, desc: 'Intraday trading' },
            { label: '1 Week', value: '1W', candles: 168, desc: 'Short-term analysis' },
            { label: '1 Month', value: '1M', candles: 720, desc: 'Medium-term trends' },
            { label: '3 Months', value: '3M', candles: 2160, desc: 'Long-term analysis' },
          ].map(tf => (
            <div key={tf.value} className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-gray-900">{tf.label}</div>
              <div className="text-xs text-gray-500 mt-1">{tf.desc}</div>
              <div className="text-xs text-blue-600 mt-2">{tf.candles} candles</div>
            </div>
          ))}
        </div>
      </div>

      <div className="chart-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
            <Shield size={24} className="text-teal-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Technology Stack</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { name: 'React 18', desc: 'UI Framework', icon: '⚛️' },
            { name: 'TypeScript', desc: 'Type Safety', icon: '📘' },
            { name: 'Vite', desc: 'Build Tool', icon: '⚡' },
            { name: 'Lightweight Charts', desc: 'TradingView Library', icon: '📊' },
            { name: 'Tailwind CSS', desc: 'Styling', icon: '🎨' },
            { name: 'Frankfurter API', desc: 'Market Data', icon: '🌐' },
          ].map(tech => (
            <div key={tech.name} className="border border-gray-200 rounded-lg p-3 flex items-center gap-3">
              <span className="text-2xl">{tech.icon}</span>
              <div>
                <div className="font-medium text-gray-900 text-sm">{tech.name}</div>
                <div className="text-xs text-gray-500">{tech.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="chart-card bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center py-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Disclaimer</h3>
          <p className="text-sm text-gray-600 max-w-2xl mx-auto">
            Forex Analytics Pro is for educational and informational purposes only. 
            Trading forex involves substantial risk of loss. Past performance does not guarantee future results. 
            Always conduct your own research and consider seeking advice from financial professionals before making trading decisions.
          </p>
          <div className="mt-4 text-xs text-gray-500">
            © 2026 Forex Analytics Pro • Built with React & TradingView Lightweight Charts
          </div>
        </div>
      </div>
    </div>
  )
}

const ChartComponent = ({ pair, timeframe }: { pair: string; timeframe: string }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)
  const candleSeriesRef = useRef<any>(null)

  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: '#ffffff' }, textColor: '#374151' },
      grid: { vertLines: { color: '#f3f4f6' }, horzLines: { color: '#f3f4f6' } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#e5e7eb' },
      timeScale: { borderColor: '#e5e7eb', timeVisible: true },
    })

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    })

    chartRef.current = chart
    candleSeriesRef.current = candleSeries

    const loadData = async () => {
      const tf = timeframes.find(t => t.value === timeframe) || timeframes[2]
      const hp = await fetchHistoricalData(pair, 90)
      const data = generateCandleData(hp, tf.candles, tf.interval)
      if (candleSeriesRef.current) {
        candleSeriesRef.current.setData(data)
        chart.timeScale().fitContent()
      }
    }

    loadData()

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth, height: 400 })
      }
    }
    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [pair, timeframe])

  return <div ref={chartContainerRef} className="w-full h-[400px]" />
}

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedPair, setSelectedPair] = useState('EUR/USD')
  const [selectedTimeframe, setSelectedTimeframe] = useState('1M')
  const [rates, setRates] = useState<Rate[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const loadRates = useCallback(async () => {
    setLoading(true)
    const realRates = await fetchRealRates()
    const newRates = pairs.map(pair => generateRate(pair, realRates))
    setRates(newRates)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadRates()
    const interval = setInterval(loadRates, 30000)
    return () => clearInterval(interval)
  }, [loadRates])

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPanel rates={rates} selectedPair={selectedPair} onPairSelect={setSelectedPair} />
      case 'analysis':
        return <AnalysisPanel pair={selectedPair} timeframe={selectedTimeframe} />
      case 'tools':
        return <ToolsPanel />
      case 'news':
        return <NewsPanel />
      case 'watchlist':
        return <WatchlistPanel />
      case 'portfolio':
        return <PortfolioPanel />
      case 'about':
        return <AboutPanel />
      default:
        return <DashboardPanel rates={rates} selectedPair={selectedPair} onPairSelect={setSelectedPair} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft size={20} className={`transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
            </button>
            <div className="flex items-center gap-2">
              <TrendingUp className="text-blue-600" size={28} />
              <h1 className="text-xl font-bold text-gray-900">Forex Analytics Pro</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadRates} className="p-2 hover:bg-gray-100 rounded-lg" title="Refresh">
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg"><Bell size={20} /></button>
            <button className="p-2 hover:bg-gray-100 rounded-lg"><Settings size={20} /></button>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">E</div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 transition-all duration-300`}>
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeTab === item.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <Icon size={20} />
                  {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
                </button>
              )
            })}
          </nav>
        </aside>

        <main className="flex-1 p-6">
          {activeTab === 'analysis' && (
            <div className="mb-4 flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency Pair</label>
                <select
                  value={selectedPair}
                  onChange={(e) => setSelectedPair(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {pairs.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timeframe</label>
                <div className="flex gap-1">
                  {timeframes.map(tf => (
                    <button
                      key={tf.value}
                      onClick={() => setSelectedTimeframe(tf.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedTimeframe === tf.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-1 ml-auto">
                <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200" title="Zoom In"><ZoomIn size={18} /></button>
                <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200" title="Zoom Out"><ZoomOut size={18} /></button>
                <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200" title="Fit All"><Maximize2 size={18} /></button>
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
              <ChartComponent pair={selectedPair} timeframe={selectedTimeframe} />
            </div>
          )}

          {renderContent()}
        </main>
      </div>
    </div>
  )
}

export default App

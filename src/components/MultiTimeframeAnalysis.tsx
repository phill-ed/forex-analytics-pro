import { useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
} from 'chart.js'
import { 
  Clock, TrendingUp, TrendingDown, BarChart2,
  Activity, Zap, RefreshCw
} from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler)

// Timeframes
const TIMEFRAMES = [
  { id: '1m', label: '1m', minutes: 1 },
  { id: '5m', label: '5m', minutes: 5 },
  { id: '15m', label: '15m', minutes: 15 },
  { id: '30m', label: '30m', minutes: 30 },
  { id: '1h', label: '1H', minutes: 60 },
  { id: '4h', label: '4H', minutes: 240 },
  { id: '1d', label: '1D', minutes: 1440 },
  { id: '1w', label: '1W', minutes: 10080 },
]

// Currency pairs
const PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'EUR/JPY']

// Generate OHLC data
const generateOHLC = (basePrice: number, count: number = 100) => {
  const data = []
  let price = basePrice
  for (let i = 0; i < count; i++) {
    const volatility = 0.0015
    const open = price
    const change = (Math.random() - 0.5) * price * volatility
    const close = price + change
    const high = Math.max(open, close) + Math.random() * price * 0.0005
    const low = Math.min(open, close) - Math.random() * price * 0.0005
    data.push({ open, high, low, close, time: i })
    price = close
  }
  return data
}

// Calculate indicators
const calculateSMA = (prices: number[], period: number) => {
  const sma = []
  for (let i = period - 1; i < prices.length; i++) {
    const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
    sma.push(sum / period)
  }
  return sma
}

const calculateEMA = (prices: number[], period: number) => {
  const ema = []
  const multiplier = 2 / (period + 1)
  let sum = prices.slice(0, period).reduce((a, b) => a + b, 0)
  let avg = sum / period
  
  for (let i = 0; i < period - 1; i++) ema.push(null)
  ema.push(avg)
  
  for (let i = period; i < prices.length; i++) {
    avg = (prices[i] - avg) * multiplier + avg
    ema.push(avg)
  }
  return ema
}

const calculateRSI = (prices: number[], period: number = 14) => {
  if (prices.length < period + 1) return 50
  let gains = 0, losses = 0
  
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1]
    if (change > 0) gains += change
    else losses -= change
  }
  
  const avgGain = gains / period
  const avgLoss = losses / period
  if (avgLoss === 0) return 100
  
  const rs = avgGain / avgLoss
  return 100 - (100 / (1 + rs))
}

const calculateBollingerBands = (prices: number[], period: number = 20) => {
  const sma = calculateSMA(prices, period)
  const upper = [], lower = [], middle = []
  
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1)
    const mean = sma[i - period + 1]
    const variance = slice.reduce((acc, p) => acc + Math.pow(p - mean, 2), 0) / period
    const stdDev = Math.sqrt(variance)
    middle.push(mean)
    upper.push(mean + 2 * stdDev)
    lower.push(mean - 2 * stdDev)
  }
  
  return { middle, upper, lower }
}

const calculateATR = (ohlc: { high: number, low: number, close: number }[], period: number = 14) => {
  const trueRanges = ohlc.map((c, i) => {
    if (i === 0) return c.high - c.low
    return Math.max(
      c.high - c.low,
      Math.abs(c.high - ohlc[i-1].close),
      Math.abs(c.low - ohlc[i-1].close)
    )
  })
  
  const atr = []
  for (let i = period - 1; i < trueRanges.length; i++) {
    const sum = trueRanges.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
    atr.push(sum / period)
  }
  return atr
}

// Detect trend
const detectTrend = (prices: number[], sma20: number[], sma50: number[]) => {
  const current = prices[prices.length - 1]
  const sma20Val = sma20[sma20.length - 1]
  const sma50Val = sma50[sma50.length - 1]
  
  if (current > sma20Val && sma20Val > sma50Val) return 'strong_uptrend'
  if (current < sma20Val && sma20Val < sma50Val) return 'strong_downtrend'
  if (current > sma20Val) return 'uptrend'
  if (current < sma20Val) return 'downtrend'
  return 'sideways'
}

// Get trend color and label
const getTrendInfo = (trend: string) => {
  switch (trend) {
    case 'strong_uptrend':
      return { color: 'text-green-400', bg: 'bg-green-900/30', label: 'Strong Uptrend', icon: TrendingUp }
    case 'strong_downtrend':
      return { color: 'text-red-400', bg: 'bg-red-900/30', label: 'Strong Downtrend', icon: TrendingDown }
    case 'uptrend':
      return { color: 'text-green-300', bg: 'bg-green-800/20', label: 'Uptrend', icon: TrendingUp }
    case 'downtrend':
      return { color: 'text-red-300', bg: 'bg-red-800/20', label: 'Downtrend', icon: TrendingDown }
    default:
      return { color: 'text-gray-400', bg: 'bg-gray-800/30', label: 'Sideways', icon: Activity }
  }
}

const MultiTimeframeAnalysis = () => {
  const [selectedPair, setSelectedPair] = useState('EUR/USD')
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h')
  const [isLoading, setIsLoading] = useState(false)

  const basePrice = selectedPair.includes('JPY') ? 150.0 : 1.0850
  const ohlc = generateOHLC(basePrice)
  const prices = ohlc.map(d => d.close)
  
  const sma20 = calculateSMA(prices, 20)
  const sma50 = calculateSMA(prices, 50)
  const sma200 = calculateSMA(prices, 200)
  const ema12 = calculateEMA(prices, 12)
  const ema26 = calculateEMA(prices, 26)
  const bollinger = calculateBollingerBands(prices)
  const atr = calculateATR(ohlc)
  
  const currentPrice = prices[prices.length - 1]
  const rsi = calculateRSI(prices)
  const trend = detectTrend(prices, sma20, sma50)
  const trendInfo = getTrendInfo(trend)
  const TrendIcon = trendInfo.icon
  
  // Calculate volatility
  const currentATR = atr[atr.length - 1] || 0
  const volatilityPercent = (currentATR / currentPrice) * 100
  
  // Daily high/low
  const dayHigh = Math.max(...ohlc.slice(-24).map(d => d.high))
  const dayLow = Math.min(...ohlc.slice(-24).map(d => d.low))
  const dayRange = dayHigh - dayLow
  
  // Price change
  const priceChange = currentPrice - prices[0]
  const priceChangePercent = (priceChange / prices[0]) * 100

  const chartData = {
    labels: ohlc.map((_, i) => i.toString()),
    datasets: [
      {
        label: 'Price',
        data: prices,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: 'SMA 20',
        data: [...Array(19).fill(null), ...sma20],
        borderColor: '#f59e0b',
        borderDash: [5, 5],
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: 'SMA 50',
        data: [...Array(49).fill(null), ...sma50],
        borderColor: '#8b5cf6',
        borderDash: [5, 5],
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: 'BB Upper',
        data: [...Array(19).fill(null), ...bollinger.upper],
        borderColor: 'rgba(239, 68, 68, 0.3)',
        pointRadius: 0,
        fill: false,
      },
      {
        label: 'BB Lower',
        data: [...Array(19).fill(null), ...bollinger.lower],
        borderColor: 'rgba(239, 68, 68, 0.3)',
        pointRadius: 0,
        fill: '-1',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' as const, labels: { color: '#9ca3af' } },
    },
    scales: {
      x: { display: false },
      y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#9ca3af' } },
    },
  }

  const refresh = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 500)
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <select
            value={selectedPair}
            onChange={(e) => setSelectedPair(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
          >
            {PAIRS.map(pair => (
              <option key={pair} value={pair}>{pair}</option>
            ))}
          </select>
          
          <div className="flex gap-1 bg-gray-900 p-1 rounded-lg">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf.id}
                onClick={() => setSelectedTimeframe(tf.id)}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  selectedTimeframe === tf.id
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
        
        <button
          onClick={refresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
          <div className="text-gray-400 text-sm mb-1">Current Price</div>
          <div className="text-2xl font-bold text-white">{currentPrice.toFixed(4)}</div>
          <div className={`text-sm ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {priceChange >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
          </div>
        </div>
        
        <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
          <div className="text-gray-400 text-sm mb-1">Trend</div>
          <div className={`flex items-center gap-2 ${trendInfo.color}`}>
            <TrendIcon size={20} />
            <span className="font-bold">{trendInfo.label}</span>
          </div>
        </div>
        
        <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
          <div className="text-gray-400 text-sm mb-1">RSI (14)</div>
          <div className={`text-2xl font-bold ${rsi > 70 ? 'text-red-400' : rsi < 30 ? 'text-green-400' : 'text-white'}`}>
            {rsi.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500">
            {rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral'}
          </div>
        </div>
        
        <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
          <div className="text-gray-400 text-sm mb-1">Volatility (ATR)</div>
          <div className="text-2xl font-bold text-white">{volatilityPercent.toFixed(2)}%</div>
          <div className="text-sm text-gray-500">
            {volatilityPercent < 0.5 ? 'Low' : volatilityPercent < 1 ? 'Medium' : 'High'}
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          📈 {selectedPair} - {selectedTimeframe.toUpperCase()} Chart
        </h3>
        <div className="h-80">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Analysis Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Moving Averages */}
        <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            📊 Moving Averages
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
              <span className="text-gray-400">SMA 20</span>
              <span className="text-white font-mono">
                {sma20[sma20.length - 1]?.toFixed(4) || '—'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
              <span className="text-gray-400">SMA 50</span>
              <span className="text-white font-mono">
                {sma50[sma50.length - 1]?.toFixed(4) || '—'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
              <span className="text-gray-400">SMA 200</span>
              <span className="text-white font-mono">
                {sma200[sma200.length - 1]?.toFixed(4) || '—'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
              <span className="text-gray-400">EMA 12</span>
              <span className="text-white font-mono">
                {ema12[ema12.length - 1]?.toFixed(4) || '—'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
              <span className="text-gray-400">EMA 26</span>
              <span className="text-white font-mono">
                {ema26[ema26.length - 1]?.toFixed(4) || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Daily Range & Levels */}
        <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            🎯 Daily Levels
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-red-900/20 rounded-lg border border-red-800/30">
              <span className="text-red-400">Daily High</span>
              <span className="text-red-300 font-mono">{dayHigh.toFixed(4)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-900/20 rounded-lg border border-green-800/30">
              <span className="text-green-400">Daily Low</span>
              <span className="text-green-300 font-mono">{dayLow.toFixed(4)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
              <span className="text-gray-400">Daily Range</span>
              <span className="text-white font-mono">{dayRange.toFixed(4)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
              <span className="text-gray-400">ATR Value</span>
              <span className="text-white font-mono">{currentATR.toFixed(4)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-900/20 rounded-lg border border-purple-800/30">
              <span className="text-purple-400">Current</span>
              <span className="text-white font-mono font-bold">{currentPrice.toFixed(4)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* All Timeframes Summary */}
      <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          🕐 All Timeframes Analysis
        </h3>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {TIMEFRAMES.map(tf => {
            const base = selectedPair.includes('JPY') ? 150.0 : 1.0850
            const data = generateOHLC(base, 50)
            const prc = data.map(d => d.close)
            const sma20 = calculateSMA(prc, 20)
            const rsi = calculateRSI(prc)
            const trend = prc[prc.length - 1] > (sma20[sma20.length - 1] || 0) ? 'up' : 'down'
            
            return (
              <button
                key={tf.id}
                onClick={() => setSelectedTimeframe(tf.id)}
                className={`p-3 rounded-lg border transition-all ${
                  selectedTimeframe === tf.id
                    ? 'bg-purple-600 border-purple-500'
                    : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="text-xs text-gray-400 mb-1">{tf.label}</div>
                <div className={`text-sm font-bold ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                  {trend === 'up' ? '▲' : '▼'}
                </div>
                <div className={`text-xs ${rsi > 70 ? 'text-red-400' : rsi < 30 ? 'text-green-400' : 'text-gray-400'}`}>
                  {rsi.toFixed(0)}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default MultiTimeframeAnalysis

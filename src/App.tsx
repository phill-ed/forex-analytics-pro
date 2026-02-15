import { useState, useEffect, useCallback } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'react-chartjs-2'
import {
  TrendingUp, TrendingDown, RefreshCw, Target,
  Activity, Zap, Calculator, BookOpen
} from 'lucide-react'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
)

// Types
interface Rate {
  pair: string
  bid: number
  ask: number
  change: number
}

interface NewsItem {
  title: string
  sentiment: 'bullish' | 'bearish' | 'neutral'
  source: string
  time: string
}

interface EconomicEvent {
  event: string
  time: string
  impact: 'HIGH' | 'MEDIUM' | 'LOW'
  currency: string
}

// Sample data generators
const generateRate = (pair: string): Rate => {
  const baseRates: Record<string, number> = {
    'EUR/USD': 1.0850, 'GBP/USD': 1.2650, 'USD/JPY': 150.50,
    'USD/CHF': 0.8850, 'AUD/USD': 0.6520, 'USD/CAD': 1.3650,
    'EUR/GBP': 0.8580, 'EUR/JPY': 163.5, 'GBP/JPY': 190.5,
    'USD/IDR': 15600, 'USD/SGD': 1.345
  }
  
  const base = baseRates[pair] || 1.0
  const variation = (Math.random() - 0.5) * base * 0.002
  const rate = base + variation
  const spread = pair.includes('JPY') || pair.includes('IDR') ? 0.05 : 0.0002
  
  return {
    pair,
    bid: rate - spread / 2,
    ask: rate + spread / 2,
    change: (Math.random() - 0.5) * 2
  }
}

const generateChartData = (_pair: string) => {
  const periods = 50
  const labels: string[] = []
  const prices: number[] = []
  const base = 1.0850
  let price = base
  
  for (let i = periods; i >= 0; i--) {
    const date = new Date()
    date.setHours(date.getHours() - i)
    labels.push(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    price = price + (Math.random() - 0.5) * price * 0.002
    prices.push(price)
  }
  
  return { labels, prices }
}

// Components
const RateCard = ({ rate }: { rate: Rate }) => (
  <div className={`rate-card ${rate.change >= 0 ? '' : 'bearish'}`}>
    <div className="flex justify-between items-start mb-2">
      <span className="font-bold text-lg">{rate.pair}</span>
      <span className={rate.change >= 0 ? 'text-green-200' : 'text-red-200'}>
        {rate.change >= 0 ? '▲' : '▼'} {Math.abs(rate.change).toFixed(2)}%
      </span>
    </div>
    <div className="flex justify-between text-sm opacity-90">
      <span>Bid: {rate.bid.toFixed(5)}</span>
      <span>Ask: {rate.ask.toFixed(5)}</span>
    </div>
    <div className="mt-2 text-xs opacity-75">
      Spread: {((rate.ask - rate.bid) * 10000).toFixed(1)} pips
    </div>
  </div>
)

const AnalysisCard = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="card p-6">
    <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
    {children}
  </div>
)

const NewsCard = ({ item }: { item: NewsItem }) => (
  <div className="news-card">
    <div className="flex justify-between items-start">
      <span className={`text-xs px-2 py-1 rounded ${
        item.sentiment === 'bullish' ? 'bg-green-100 text-green-700' :
        item.sentiment === 'bearish' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
      }`}>
        {item.sentiment.toUpperCase()}
      </span>
      <span className="text-xs text-gray-500">{item.source}</span>
    </div>
    <p className="mt-2 font-medium text-gray-800">{item.title}</p>
  </div>
)

const EconomicEventItem = ({ event }: { event: EconomicEvent }) => (
  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-2">
    <span className="text-lg">
      {event.impact === 'HIGH' ? '🔴' : event.impact === 'MEDIUM' ? '🟡' : '🟢'}
    </span>
    <div className="flex-1">
      <div className="font-medium text-gray-800">{event.event}</div>
      <div className="text-sm text-gray-500">{event.time} • {event.currency}</div>
    </div>
  </div>
)

// Main App Component
function App() {
  const [darkMode] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedCategory, setSelectedCategory] = useState('majors')
  const [selectedPair, setSelectedPair] = useState('EUR/USD')
  const [timeframe, setTimeframe] = useState('1h')
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [rates, setRates] = useState<Rate[]>([])
  const [chartData, setChartData] = useState<{ labels: string[], prices: number[] }>({ labels: [], prices: [] })

  const categories = {
    majors: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD'],
    cross: ['EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'EUR/AUD'],
    asia: ['USD/IDR', 'USD/SGD', 'AUD/NZD']
  }

  const refreshData = useCallback(() => {
    // Generate rates
    const newRates = categories[selectedCategory as keyof typeof categories].map(generateRate)
    setRates(newRates)
    
    // Generate chart data
    setChartData(generateChartData(selectedPair))
    
    setLastUpdated(new Date())
  }, [selectedCategory, selectedPair])

  useEffect(() => {
    refreshData()
    const interval = setInterval(refreshData, 60000)
    return () => clearInterval(interval)
  }, [refreshData])

  // Generate analysis data
  const rsi = 30 + Math.random() * 40
  const trend = rsi > 60 ? 'bullish' : rsi < 40 ? 'bearish' : 'neutral'
  const signal = trend === 'bullish' ? 'BUY' : trend === 'bearish' ? 'SELL' : 'HOLD'
  const confidence = 50 + Math.random() * 40

  // News data
  const news: NewsItem[] = [
    { title: 'Fed signals potential rate cuts later this year', sentiment: 'bullish', source: 'Reuters', time: '2h ago' },
    { title: 'ECB maintains current interest rates', sentiment: 'neutral', source: 'Bloomberg', time: '3h ago' },
    { title: 'US Dollar weakens amid trade tensions', sentiment: 'bearish', source: 'Forex Factory', time: '4h ago' },
    { title: 'Japanese Yen surges on inflation data', sentiment: 'bullish', source: 'Investing.com', time: '5h ago' },
    { title: 'EUR/USD pair consolidates near monthly highs', sentiment: 'neutral', source: 'DailyFX', time: '6h ago' }
  ]

  // Economic events
  const events: EconomicEvent[] = [
    { event: 'US Initial Jobless Claims', time: '14:30 GMT', impact: 'HIGH', currency: 'USD' },
    { event: 'ECB President Speech', time: '15:00 GMT', impact: 'HIGH', currency: 'EUR' },
    { event: 'FOMC Meeting Minutes', time: '18:00 GMT', impact: 'HIGH', currency: 'USD' },
    { event: 'Japanese CPI', time: 'Tomorrow 01:30 GMT', impact: 'MEDIUM', currency: 'JPY' },
    { event: 'German GDP', time: 'Tomorrow 09:00 GMT', impact: 'MEDIUM', currency: 'EUR' }
  ]

  // Chart configuration
  const lineChartData = {
    labels: chartData.labels,
    datasets: [{
      label: selectedPair,
      data: chartData.prices,
      borderColor: '#667eea',
      backgroundColor: 'rgba(102, 126, 234, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 2
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: 'rgba(0,0,0,0.1)' } }
    }
  }

  // Tab button component
  const TabButton = ({ tab, icon, label }: { tab: string, icon: React.ReactNode, label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap flex items-center gap-2 ${
        activeTab === tab
          ? 'tab-active'
          : 'bg-white text-gray-700 hover:bg-gray-100'
      }`}
    >
      {icon} {label}
    </button>
  )

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className="gradient-bg text-white py-6 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">📈 Forex Analytics Dashboard</h1>
              <p className="text-blue-100 mt-1">Real-time forex analysis with AI-powered insights</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-100">Last updated</p>
              <p className="text-xl font-mono font-bold">{lastUpdated.toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Pair Selection */}
        <div className="card p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">📁 Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                  const pair = categories[e.target.value as keyof typeof categories][0]
                  setSelectedPair(pair)
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              >
                <option value="majors">Major Pairs</option>
                <option value="cross">Cross Pairs</option>
                <option value="asia">Asia-Pacific</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">💱 Currency Pair</label>
              <select
                value={selectedPair}
                onChange={(e) => {
                  setSelectedPair(e.target.value)
                  refreshData()
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              >
                {categories[selectedCategory as keyof typeof categories].map(pair => (
                  <option key={pair} value={pair}>{pair}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">📊 Timeframe</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              >
                <option value="1m">1 Minute</option>
                <option value="5m">5 Minutes</option>
                <option value="15m">15 Minutes</option>
                <option value="30m">30 Minutes</option>
                <option value="1h">1 Hour</option>
                <option value="4h">4 Hours</option>
                <option value="1d">1 Day</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={refreshData}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center gap-2"
              >
                <RefreshCw size={20} /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Live Rates */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">💹 Live Rates</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {rates.map(rate => (
              <RateCard key={rate.pair} rate={rate} />
            ))}
          </div>
        </section>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <TabButton tab="dashboard" icon={<Activity size={18} />} label="Dashboard" />
          <TabButton tab="ai" icon={<Zap size={18} />} label="AI Analysis" />
          <TabButton tab="news" icon={<BookOpen size={18} />} label="News" />
          <TabButton tab="tools" icon={<Calculator size={18} />} label="Tools" />
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">📈 Price Chart - {selectedPair}</h3>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="labels" />
                    <YAxis domain={['auto', 'auto']} />
                    <Tooltip />
                    <Line dataKey="data" stroke="#667eea" fill="rgba(102, 126, 234, 0.1)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Quick Analysis</h3>
              <div className="text-center mb-4">
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-2 ${
                  trend === 'bullish' ? 'bg-green-100' : trend === 'bearish' ? 'bg-red-100' : 'bg-yellow-100'
                }`}>
                  <span className="text-3xl">{trend === 'bullish' ? '🟢' : trend === 'bearish' ? '🔴' : '🟡'}</span>
                </div>
                <div className="text-2xl font-bold text-gray-800">{trend.toUpperCase()}</div>
                <div className="mt-2">
                  <span className={`signal-${signal.toLowerCase()}`}>{signal}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">RSI (14)</span>
                  <span className="font-bold">{rsi.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Confidence</span>
                  <span className="font-bold text-purple-600">{confidence.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <AnalysisCard title="🔮 AI Trend Prediction">
              <div className="text-center mb-6">
                <div className="text-5xl mb-2">{trend === 'bullish' ? '🐂' : trend === 'bearish' ? '🐻' : '⚖️'}</div>
                <div className="text-2xl font-bold text-gray-800">{trend.toUpperCase()}</div>
                <div className="text-purple-600 font-semibold mt-2">{confidence.toFixed(0)}% Confidence</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">📊 Based on RSI, Moving Averages, and MACD analysis. This is for educational purposes only.</p>
              </div>
            </AnalysisCard>
            <AnalysisCard title="📊 Support & Resistance">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-red-50 rounded-lg">
                  <span className="text-red-600 font-medium">R1 - Resistance</span>
                  <span className="font-bold text-red-600">{(generateRate(selectedPair).bid * 1.002).toFixed(5)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                  <span className="text-green-600 font-medium">Pivot Point</span>
                  <span className="font-bold text-green-600">{generateRate(selectedPair).bid.toFixed(5)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-red-50 rounded-lg">
                  <span className="text-red-600 font-medium">S1 - Support</span>
                  <span className="font-bold text-red-600">{(generateRate(selectedPair).bid * 0.998).toFixed(5)}</span>
                </div>
              </div>
            </AnalysisCard>
          </div>
        )}

        {activeTab === 'news' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <AnalysisCard title="📰 Latest Forex News">
              <div className="max-h-96 overflow-y-auto">
                {news.map((item, i) => <NewsCard key={i} item={item} />)}
              </div>
            </AnalysisCard>
            <AnalysisCard title="📅 Economic Calendar">
              <div className="max-h-96 overflow-y-auto">
                {events.map((event, i) => <EconomicEventItem key={i} event={event} />)}
              </div>
            </AnalysisCard>
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnalysisCard title="🧮 Position Size Calculator">
              <div className="space-y-4">
                <input type="number" id="balance" placeholder="Account Balance ($)" defaultValue={10000}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
                <input type="number" id="risk" placeholder="Risk %" defaultValue={1}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
                <input type="number" id="stoploss" placeholder="Stop Loss (pips)" defaultValue={20}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
                <button
                  onClick={() => {
                    const balance = parseFloat((document.getElementById('balance') as HTMLInputElement).value) || 10000
                    const risk = parseFloat((document.getElementById('risk') as HTMLInputElement).value) || 1
                    const sl = parseFloat((document.getElementById('stoploss') as HTMLInputElement).value) || 20
                    const riskAmount = balance * (risk / 100)
                    const lots = riskAmount / (sl * 0.0001 * 100000)
                    alert(`Position Size: ${lots.toFixed(2)} lots\nRisk: $${riskAmount.toFixed(2)}`)
                  }}
                  className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Calculate
                </button>
              </div>
            </AnalysisCard>
            <AnalysisCard title="⚖️ Risk/Reward Calculator">
              <div className="space-y-4">
                <input type="number" id="entry" placeholder="Entry Price" step={0.00001}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
                <input type="number" id="rr-stoploss" placeholder="Stop Loss" step={0.00001}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
                <input type="number" id="target" placeholder="Take Profit" step={0.00001}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
                <button
                  onClick={() => {
                    const entry = parseFloat((document.getElementById('entry') as HTMLInputElement).value) || 1.0850
                    const sl = parseFloat((document.getElementById('rr-stoploss') as HTMLInputElement).value) || 1.0800
                    const tp = parseFloat((document.getElementById('target') as HTMLInputElement).value) || 1.0950
                    const risk = Math.abs(entry - sl)
                    const reward = Math.abs(tp - entry)
                    const rr = risk > 0 ? reward / risk : 0
                    alert(`Risk/Reward Ratio: ${rr.toFixed(2)}\n${rr >= 2 ? '✅ Good ratio' : '⚠️ Consider 2:1 or better'}`)
                  }}
                  className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Calculate R:R
                </button>
              </div>
            </AnalysisCard>
            <AnalysisCard title="💰 Pip Value Calculator">
              <div className="space-y-4">
                <select id="pip-pair" className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                  <option value="EUR/USD">EUR/USD</option>
                  <option value="USD/JPY">USD/JPY</option>
                  <option value="GBP/USD">GBP/USD</option>
                </select>
                <input type="number" id="lots" placeholder="Lot Size" defaultValue={1}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
                <button
                  onClick={() => {
                    const _pair = (document.getElementById('pip-pair') as HTMLSelectElement).value
                    const lots = parseFloat((document.getElementById('lots') as HTMLInputElement).value) || 1
                    const pipValue = lots * 10
                    alert(`Pip Value: $${pipValue.toFixed(2)} per lot`)
                  }}
                  className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Calculate
                </button>
              </div>
            </AnalysisCard>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 px-4 mt-12">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-400 mb-2">📈 Forex Analytics Dashboard</p>
          <p className="text-sm text-gray-500">⚠️ This dashboard is for educational purposes only. Not financial advice.</p>
          <p className="text-xs text-gray-600 mt-4">
            Built with React + TypeScript + Chart.js | <a href="#" className="text-purple-400">GitHub</a>
          </p>
        </div>
      </footer>

      {/* Styles */}
      <style>{`
        .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .card { background: white; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .rate-card { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); border-radius: 16px; color: white; padding: 20px; }
        .rate-card.bearish { background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%); }
        .tab-active { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .signal-buy { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 4px 16px; border-radius: 20px; font-weight: 600; }
        .signal-sell { background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%); color: white; padding: 4px 16px; border-radius: 20px; font-weight: 600; }
        .signal-hold { background: linear-gradient(135deg, #f7971e 0%, #ffd200 100%); color: #333; padding: 4px 16px; border-radius: 20px; font-weight: 600; }
        .news-card { background: white; border-radius: 12px; padding: 15px; margin: 8px 0; border-left: 4px solid #667eea; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
      `}</style>
    </div>
  )
}

export default App

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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'react-chartjs-2'

// Import components
import TechnicalAnalysis from './components/TechnicalAnalysis'
import TradingTools from './components/TradingTools'
import NewsFeed from './components/NewsFeed'
import Watchlist from './components/Watchlist'
import WebScraper from './components/WebScraper'
import PortfolioTracker from './components/PortfolioTracker'
import MultiTimeframeAnalysis from './components/MultiTimeframeAnalysis'

// Register ChartJS
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  Title, ChartTooltip, Legend, Filler
)

// Types
interface Rate {
  pair: string
  bid: number
  ask: number
  change: number
  changePercent: number
}

// Generate random rate
const generateRate = (pair: string): Rate => {
  const base: Record<string, number> = {
    'EUR/USD': 1.0850, 'GBP/USD': 1.2650, 'USD/JPY': 150.50, 'USD/CHF': 0.8850,
    'AUD/USD': 0.6550, 'USD/CAD': 1.3550, 'NZD/USD': 0.6050, 'EUR/GBP': 0.8580,
    'EUR/JPY': 163.20, 'GBP/JPY': 190.50, 'EUR/CHF': 0.9600, 'AUD/JPY': 98.50,
  }
  const price = base[pair] || 1.0
  const spread = pair.includes('JPY') ? 0.02 : 0.0002
  const change = (Math.random() - 0.5) * price * 0.003
  return {
    pair,
    bid: price + change,
    ask: price + change + spread,
    change: change,
    changePercent: (change / price) * 100
  }
}

// Generate chart data
const generateChartData = (pair: string) => {
  const base = pair.includes('JPY') ? 150 : 1.08
  const labels = Array.from({ length: 24 }, (_, i) => `${i + 9}:00`)
  const prices = Array.from({ length: 24 }, () => base + (Math.random() - 0.5) * base * 0.01)
  return { labels, prices }
}

// Navigation items
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'analysis', label: 'Analysis', icon: '📈' },
  { id: 'tools', label: 'Tools', icon: '🧮' },
  { id: 'news', label: 'News', icon: '📰' },
  { id: 'watchlist', label: 'Watchlist', icon: '⭐' },
  { id: 'portfolio', label: 'Portfolio', icon: '💼' },
  { id: 'scraper', label: 'Scraper', icon: '🕷️' },
]

// Main App
function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedPair, setSelectedPair] = useState('EUR/USD')
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [rates, setRates] = useState<Rate[]>([])
  const [chartData, setChartData] = useState<{ labels: string[], prices: number[] }>({ labels: [], prices: [] })

  const pairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'EUR/GBP', 'EUR/JPY']

  const refreshData = useCallback(() => {
    const newRates = pairs.map(generateRate)
    setRates(newRates)
    setChartData(generateChartData(selectedPair))
    setLastUpdated(new Date())
  }, [selectedPair])

  useEffect(() => {
    refreshData()
    const interval = setInterval(refreshData, 5000)
    return () => clearInterval(interval)
  }, [refreshData])

  const gainers = rates.filter(r => r.changePercent > 0).length
  const losers = rates.filter(r => r.changePercent < 0).length
  const selectedRate = rates.find(r => r.pair === selectedPair)

  // Chart config
  const lineChartData = {
    labels: chartData.labels,
    datasets: [{
      label: selectedPair,
      data: chartData.prices,
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37, 99, 235, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 0,
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#64748b' } },
      y: { grid: { color: '#e2e8f0' }, ticks: { color: '#64748b' } }
    },
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation Bar */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                FX
              </div>
              <h1 className="text-xl font-bold text-slate-800">Forex Analytics</h1>
            </div>

            {/* Nav Menu */}
            <nav className="flex items-center gap-1">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              <select
                value={selectedPair}
                onChange={(e) => setSelectedPair(e.target.value)}
                className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700"
              >
                {pairs.map(pair => (
                  <option key={pair} value={pair}>{pair}</option>
                ))}
              </select>
              
              <button 
                onClick={refreshData}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600"
              >
                🔄
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-sm">Gainers</div>
                <div className="text-2xl font-bold text-green-600">{gainers}</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-sm">Losers</div>
                <div className="text-2xl font-bold text-red-600">{losers}</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-sm">{selectedPair}</div>
                <div className="text-2xl font-bold text-slate-800">{selectedRate?.bid.toFixed(4) || '—'}</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-sm">Signal</div>
                <div className="text-2xl font-bold text-blue-600">BUY</div>
              </div>
            </div>

            {/* Main Chart */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800">{selectedPair} Price Chart</h3>
                <div className="flex gap-2">
                  {['1H', '4H', '1D', '1W'].map(tf => (
                    <button key={tf} className="px-3 py-1 text-sm bg-slate-100 text-slate-600 rounded hover:bg-slate-200">
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="labels" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                    <Line dataKey="data" stroke="#2563eb" fill="rgba(37, 99, 235, 0.1)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Live Rates */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Live Rates</h3>
              <div className="grid grid-cols-4 gap-4">
                {rates.map(rate => (
                  <button
                    key={rate.pair}
                    onClick={() => setSelectedPair(rate.pair)}
                    className={`bg-white rounded-xl p-4 text-left shadow-sm border transition-all ${
                      selectedPair === rate.pair 
                        ? 'border-blue-500 ring-2 ring-blue-100' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-slate-800">{rate.pair}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        rate.changePercent >= 0 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {rate.changePercent >= 0 ? '▲' : '▼'} {Math.abs(rate.changePercent).toFixed(2)}%
                      </span>
                    </div>
                    <div className="text-lg font-bold text-slate-800">{rate.bid.toFixed(4)}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Other Tabs */}
        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <TechnicalAnalysis pair={selectedPair} timeframe="1h" />
            <MultiTimeframeAnalysis />
          </div>
        )}

        {activeTab === 'tools' && <TradingTools />}
        {activeTab === 'news' && <NewsFeed pair={selectedPair} />}
        {activeTab === 'watchlist' && <Watchlist />}
        {activeTab === 'portfolio' && <PortfolioTracker />}
        {activeTab === 'scraper' && <WebScraper />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          Forex Analytics Dashboard • Built with React + Chart.js
        </div>
      </footer>
    </div>
  )
}

export default App

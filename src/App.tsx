import { useState, useEffect, useCallback } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import {
  LayoutDashboard,
  TrendingUp,
  Calculator,
  Newspaper,
  Star,
  Briefcase,
  Globe,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  Settings,
  User
} from 'lucide-react'
import './App.css'

// Register ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
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
    'EUR/JPY': 163.20, 'GBP/JPY': 190.50, 'EUR/CHF': 0.9600, 'AUD/JPY': 98.50
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
const generateChartData = () => {
  const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`)
  const prices = Array.from({ length: 24 }, (_, i) => 1.08 + Math.sin(i / 3) * 0.01 + (Math.random() - 0.5) * 0.005)
  return { labels, prices }
}

// Navigation items
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'analysis', label: 'Analysis', icon: TrendingUp },
  { id: 'tools', label: 'Trading Tools', icon: Calculator },
  { id: 'news', label: 'Market News', icon: Newspaper },
  { id: 'watchlist', label: 'Watchlist', icon: Star },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
]

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedPair, setSelectedPair] = useState('EUR/USD')
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [rates, setRates] = useState<Rate[]>([])
  const [chartData, setChartData] = useState<{ labels: string[], prices: number[] }>({ labels: [], prices: [] })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const pairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'EUR/GBP', 'EUR/JPY']

  const refreshData = useCallback(() => {
    const newRates = pairs.map(generateRate)
    setRates(newRates)
    setChartData(generateChartData())
    setLastUpdated(new Date())
  }, [])

  useEffect(() => {
    refreshData()
    const interval = setInterval(refreshData, 30000)
    return () => clearInterval(interval)
  }, [refreshData])

  // Quick stats
  const gainers = rates.filter(r => r.changePercent > 0).length
  const losers = rates.filter(r => r.changePercent < 0).length
  const selectedRate = rates.find(r => r.pair === selectedPair)

  // Chart config
  const lineChartData = {
    labels: chartData.labels,
    datasets: [{
      label: selectedPair,
      data: chartData.prices,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 6,
      borderWidth: 2,
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 12,
        titleColor: '#f1f5f9',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
      }
    },
    scales: {
      x: { 
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 11 } }
      },
      y: { 
        grid: { color: '#f1f5f9' },
        ticks: { color: '#64748b', font: { size: 11 } }
      }
    },
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}>
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <TrendingUp className="text-white" size={20} />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="font-bold text-gray-900 text-lg">ForexPro</h1>
                <p className="text-xs text-gray-500">Analytics Dashboard</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === item.id
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={20} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* Collapse Button */}
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            {!sidebarCollapsed && <span className="text-sm">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {navItems.find(n => n.id === activeTab)?.label}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search pairs..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Pair Selector */}
            <select
              value={selectedPair}
              onChange={(e) => setSelectedPair(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {pairs.map(pair => (
                <option key={pair} value={pair}>{pair}</option>
              ))}
            </select>
            
            {/* Refresh */}
            <button 
              onClick={refreshData} 
              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <RefreshCw size={20} />
            </button>
            
            {/* Icons */}
            <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              <Bell size={20} />
            </button>
            <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              <Settings size={20} />
            </button>
            <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              <User size={20} />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Dashboard View */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Quick Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stat-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Market Gainers</p>
                      <p className="text-2xl font-bold text-gray-900">{gainers}</p>
                      <p className="text-xs text-green-600 mt-1">↑ Trending up</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <TrendingUp className="text-green-600" size={24} />
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Market Losers</p>
                      <p className="text-2xl font-bold text-gray-900">{losers}</p>
                      <p className="text-xs text-red-600 mt-1">↓ Trending down</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                      <TrendingUp className="text-red-600 transform rotate-180" size={24} />
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{selectedPair}</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedRate?.bid.toFixed(5) || '—'}</p>
                      <p className={`text-xs mt-1 ${selectedRate && selectedRate.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedRate ? `${selectedRate.changePercent >= 0 ? '↑' : '↓'} ${Math.abs(selectedRate.changePercent).toFixed(2)}%` : '—'}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Globe className="text-blue-600" size={24} />
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Active Pairs</p>
                      <p className="text-2xl font-bold text-gray-900">{rates.length}</p>
                      <p className="text-xs text-blue-600 mt-1">Live tracking</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <Star className="text-purple-600" size={24} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Chart */}
              <div className="chart-card">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedPair} Price Chart</h3>
                    <p className="text-sm text-gray-500">Last updated: {lastUpdated.toLocaleTimeString()}</p>
                  </div>
                  <div className="flex gap-2">
                    {['1H', '4H', '1D', '1W', '1M'].map(tf => (
                      <button 
                        key={tf} 
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-96">
                  <Line data={lineChartData} options={chartOptions} />
                </div>
              </div>

              {/* Live Rates Grid */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Currency Rates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {rates.map(rate => (
                    <button
                      key={rate.pair}
                      onClick={() => setSelectedPair(rate.pair)}
                      className={`rate-card ${selectedPair === rate.pair ? 'ring-2 ring-blue-500' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="font-semibold text-gray-900">{rate.pair}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          rate.changePercent >= 0 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {rate.changePercent >= 0 ? '↑' : '↓'} {Math.abs(rate.changePercent).toFixed(2)}%
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-gray-900">{rate.bid.toFixed(5)}</div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Bid: {rate.bid.toFixed(5)}</span>
                          <span>Ask: {rate.ask.toFixed(5)}</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          Spread: {((rate.ask - rate.bid) * 10000).toFixed(1)} pips
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Analysis Tab */}
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              <div className="chart-card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Analysis</h3>
                <p className="text-gray-600">Advanced technical analysis tools coming soon...</p>
              </div>
            </div>
          )}

          {/* Tools Tab */}
          {activeTab === 'tools' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Position Size Calculator */}
                <div className="chart-card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Position Size Calculator</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Account Balance ($)</label>
                      <input type="number" defaultValue={10000} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Risk (%)</label>
                      <input type="number" defaultValue={1} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Stop Loss (pips)</label>
                      <input type="number" defaultValue={20} className="input-field" />
                    </div>
                    <button className="btn-primary w-full">Calculate</button>
                  </div>
                </div>

                {/* Risk/Reward Calculator */}
                <div className="chart-card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk/Reward Calculator</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Entry Price</label>
                      <input type="number" step="0.00001" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Stop Loss</label>
                      <input type="number" step="0.00001" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Take Profit</label>
                      <input type="number" step="0.00001" className="input-field" />
                    </div>
                    <button className="btn-primary w-full">Calculate R:R</button>
                  </div>
                </div>

                {/* Pip Value Calculator */}
                <div className="chart-card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Pip Value Calculator</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Currency Pair</label>
                      <select className="input-field">
                        <option>EUR/USD</option>
                        <option>GBP/USD</option>
                        <option>USD/JPY</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Lot Size</label>
                      <input type="number" defaultValue={1} className="input-field" />
                    </div>
                    <button className="btn-primary w-full">Calculate</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other Tabs Placeholder */}
          {['news', 'watchlist', 'portfolio'].includes(activeTab) && (
            <div className="chart-card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {navItems.find(n => n.id === activeTab)?.label}
              </h3>
              <p className="text-gray-600">This section is under development. Coming soon!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App

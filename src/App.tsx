import { useState, useEffect, useRef, useCallback } from 'react'
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
  User,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react'
import { createChart, ColorType, CrosshairMode, Time } from 'lightweight-charts'
import './App.css'

// Types
interface Rate {
  pair: string
  bid: number
  ask: number
  change: number
  changePercent: number
}

interface CandleData {
  time: Time
  open: number
  high: number
  low: number
  close: number
}

interface Timeframe {
  label: string
  value: string
  candles: number
  interval: number // seconds
}

// Timeframe options
const timeframes: Timeframe[] = [
  { label: '1D', value: '1D', candles: 24, interval: 3600 },
  { label: '1W', value: '1W', candles: 168, interval: 3600 },
  { label: '1M', value: '1M', candles: 720, interval: 3600 },
  { label: '3M', value: '3M', candles: 2160, interval: 3600 },
  { label: '6M', value: '6M', candles: 4320, interval: 3600 },
  { label: '1Y', value: '1Y', candles: 8760, interval: 3600 },
  { label: 'ALL', value: 'ALL', candles: 17520, interval: 3600 },
]

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

// Generate candlestick data based on timeframe
const generateCandleData = (count: number, intervalSeconds: number = 3600): CandleData[] => {
  const data: CandleData[] = []
  let basePrice = 1.0850
  
  for (let i = count; i > 0; i--) {
    const timestamp = Math.floor(Date.now() / intervalSeconds) * intervalSeconds - (i * intervalSeconds)
    
    const volatility = basePrice * 0.002
    const open = basePrice + (Math.random() - 0.5) * volatility
    const close = open + (Math.random() - 0.5) * volatility
    const high = Math.max(open, close) + Math.random() * volatility * 0.5
    const low = Math.min(open, close) - Math.random() * volatility * 0.5
    
    data.push({ time: timestamp as Time, open, high, low, close })
    basePrice = close
  }
  
  return data
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
  const [selectedTimeframe, setSelectedTimeframe] = useState('1M')
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [rates, setRates] = useState<Rate[]>([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)
  const candleSeriesRef = useRef<any>(null)

  const pairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'EUR/GBP', 'EUR/JPY']

  const refreshData = useCallback(() => {
    const newRates = pairs.map(generateRate)
    setRates(newRates)
    setLastUpdated(new Date())
  }, [])

  // Initialize chart with zoom/scroll enabled
  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#64748b',
      },
      grid: {
        vertLines: { color: '#f1f5f9' },
        horzLines: { color: '#f1f5f9' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 450,
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      timeScale: {
        borderColor: '#e5e7eb',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 10,
        barSpacing: 6,
        minBarSpacing: 2,
        maxBarSpacing: 50,
      },
      rightPriceScale: {
        borderColor: '#e5e7eb',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    })

    const newCandleSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#10b981',
      wickDownColor: '#ef4444',
      wickUpColor: '#10b981',
    })

    chartRef.current = chart
    candleSeriesRef.current = newCandleSeries

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ 
          width: chartContainerRef.current.clientWidth 
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (chartRef.current) {
        chartRef.current.remove()
      }
    }
  }, [])

  // Update chart data when pair or timeframe changes
  useEffect(() => {
    const tf = timeframes.find(t => t.value === selectedTimeframe) || timeframes[2]
    const data = generateCandleData(tf.candles, tf.interval)
    
    if (candleSeriesRef.current) {
      candleSeriesRef.current.setData(data)
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent()
      }
    }
  }, [selectedPair, selectedTimeframe])

  // Initial data load and refresh interval
  useEffect(() => {
    refreshData()
    const interval = setInterval(refreshData, 30000)
    return () => clearInterval(interval)
  }, [refreshData])

  // Chart controls
  const handleZoomIn = () => {
    if (chartRef.current) {
      const timeScale = chartRef.current.timeScale()
      const currentOptions = timeScale.options()
      timeScale.applyOptions({
        barSpacing: Math.min(currentOptions.barSpacing * 1.5, 100),
      })
    }
  }

  const handleZoomOut = () => {
    if (chartRef.current) {
      const timeScale = chartRef.current.timeScale()
      const currentOptions = timeScale.options()
      timeScale.applyOptions({
        barSpacing: Math.max(currentOptions.barSpacing / 1.5, 2),
      })
    }
  }

  const handleFitContent = () => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent()
    }
  }

  // Quick stats
  const gainers = rates.filter(r => r.changePercent > 0).length
  const losers = rates.filter(r => r.changePercent < 0).length
  const selectedRate = rates.find(r => r.pair === selectedPair)

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

              {/* Candlestick Chart */}
              <div className="chart-card">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedPair} Candlestick Chart</h3>
                    <p className="text-sm text-gray-500">Last updated: {lastUpdated.toLocaleTimeString()}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Timeframe Selector */}
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      {timeframes.map(tf => (
                        <button
                          key={tf.value}
                          onClick={() => setSelectedTimeframe(tf.value)}
                          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                            selectedTimeframe === tf.value
                              ? 'bg-white text-blue-600 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          {tf.label}
                        </button>
                      ))}
                    </div>
                    
                    {/* Zoom Controls */}
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={handleZoomIn}
                        className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-white rounded-md transition-all"
                        title="Zoom In"
                      >
                        <ZoomIn size={18} />
                      </button>
                      <button
                        onClick={handleZoomOut}
                        className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-white rounded-md transition-all"
                        title="Zoom Out"
                      >
                        <ZoomOut size={18} />
                      </button>
                      <button
                        onClick={handleFitContent}
                        className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-white rounded-md transition-all"
                        title="Fit All"
                      >
                        <Maximize2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div ref={chartContainerRef} className="h-[450px]" />
                
                <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm bg-green-500"></span>
                    Bullish
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm bg-red-500"></span>
                    Bearish
                  </span>
                  <span className="text-gray-500">|</span>
                  <span className="text-gray-500">Scroll to pan • Mouse wheel to zoom</span>
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

import { useState, useEffect } from 'react'
import { 
  TrendingUp, TrendingDown, Wallet, Percent, 
  Target, RefreshCw, Plus, X, Calendar
} from 'lucide-react'

// Types
interface Position {
  id: number
  pair: string
  type: 'buy' | 'sell'
  entryPrice: number
  currentPrice: number
  lotSize: number
  openDate: Date
  stopLoss?: number
  takeProfit?: number
  profit: number
  profitPercent: number
}

// Demo positions
const demoPositions: Position[] = [
  {
    id: 1,
    pair: 'EUR/USD',
    type: 'buy',
    entryPrice: 1.0820,
    currentPrice: 1.0850,
    lotSize: 1.0,
    openDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    stopLoss: 1.0780,
    takeProfit: 1.0900,
    profit: 30.00,
    profitPercent: 0.28
  },
  {
    id: 2,
    pair: 'GBP/USD',
    type: 'sell',
    entryPrice: 1.2700,
    currentPrice: 1.2650,
    lotSize: 0.5,
    openDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    profit: 25.00,
    profitPercent: 0.20
  },
  {
    id: 3,
    pair: 'USD/JPY',
    type: 'buy',
    entryPrice: 150.00,
    currentPrice: 150.50,
    lotSize: 0.8,
    openDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    stopLoss: 149.50,
    profit: 40.00,
    profitPercent: 0.27
  },
  {
    id: 4,
    pair: 'AUD/USD',
    type: 'sell',
    entryPrice: 0.6600,
    currentPrice: 0.6550,
    lotSize: 1.0,
    openDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    takeProfit: 0.6450,
    profit: 50.00,
    profitPercent: 0.76
  }
]

// Closed trades history
interface ClosedTrade {
  id: number
  pair: string
  type: 'buy' | 'sell'
  entryPrice: number
  exitPrice: number
  lotSize: number
  openDate: Date
  closeDate: Date
  profit: number
  profitPercent: number
  duration: string
}

const demoClosedTrades: ClosedTrade[] = [
  {
    id: 1,
    pair: 'EUR/USD',
    type: 'buy',
    entryPrice: 1.0750,
    exitPrice: 1.0820,
    lotSize: 1.0,
    openDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    closeDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    profit: 70.00,
    profitPercent: 0.65,
    duration: '2 days'
  },
  {
    id: 2,
    pair: 'GBP/JPY',
    type: 'sell',
    entryPrice: 191.00,
    exitPrice: 190.50,
    lotSize: 0.5,
    openDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    closeDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    profit: 23.75,
    profitPercent: 0.25,
    duration: '1 day'
  },
  {
    id: 3,
    pair: 'USD/CHF',
    type: 'buy',
    entryPrice: 0.8800,
    exitPrice: 0.8750,
    lotSize: 1.0,
    openDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    closeDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    profit: -50.00,
    profitPercent: -0.57,
    duration: '1 day'
  },
]

const PortfolioTracker = () => {
  const [positions, setPositions] = useState<Position[]>(demoPositions)
  const [closedTrades, setClosedTrades] = useState<ClosedTrade[]>(demoClosedTrades)
  const [activeTab, setActiveTab] = useState<'open' | 'closed' | 'stats'>('open')
  const [isLoading, setIsLoading] = useState(false)

  // Calculate totals
  const totalProfit = positions.reduce((sum, p) => sum + p.profit, 0)
  const totalProfitPercent = positions.reduce((sum, p) => sum + p.profitPercent, 0)
  const totalValue = positions.reduce((sum, p) => sum + (p.lotSize * 100000 * p.currentPrice), 0)
  
  // Calculate win rate from closed trades
  const winningTrades = closedTrades.filter(t => t.profit > 0)
  const losingTrades = closedTrades.filter(t => t.profit < 0)
  const winRate = closedTrades.length > 0 
    ? Math.round((winningTrades.length / closedTrades.length) * 100) 
    : 0
  
  const totalClosedProfit = closedTrades.reduce((sum, t) => sum + t.profit, 0)
  const avgWin = winningTrades.length > 0 
    ? winningTrades.reduce((sum, t) => sum + t.profit, 0) / winningTrades.length 
    : 0
  const avgLoss = losingTrades.length > 0 
    ? Math.abs(losingTrades.reduce((sum, t) => sum + t.profit, 0) / losingTrades.length) 
    : 0
  const profitFactor = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : '0'

  const refreshPrices = () => {
    setIsLoading(true)
    setTimeout(() => {
      // Simulate price changes
      setPositions(prev => prev.map(p => {
        const change = (Math.random() - 0.5) * 0.002
        const newPrice = p.currentPrice * (1 + change)
        const priceDiff = p.type === 'buy' ? newPrice - p.entryPrice : p.entryPrice - newPrice
        const pipValue = p.pair.includes('JPY') ? 0.01 : 0.0001
        const profit = (priceDiff / pipValue) * p.lotSize * 10
        const profitPercent = (priceDiff / p.entryPrice) * 100
        
        return {
          ...p,
          currentPrice: newPrice,
          profit: Math.round(profit * 100) / 100,
          profitPercent: Math.round(profitPercent * 100) / 100
        }
      }))
      setIsLoading(false)
    }, 500)
  }

  const closePosition = (id: number) => {
    const position = positions.find(p => p.id === id)
    if (!position) return

    // Move to closed trades
    const closedTrade: ClosedTrade = {
      id: Date.now(),
      pair: position.pair,
      type: position.type,
      entryPrice: position.entryPrice,
      exitPrice: position.currentPrice,
      lotSize: position.lotSize,
      openDate: position.openDate,
      closeDate: new Date(),
      profit: position.profit,
      profitPercent: position.profitPercent,
      duration: '2 days'
    }

    setClosedTrades([closedTrade, ...closedTrades])
    setPositions(positions.filter(p => p.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          💼 Portfolio Tracker
        </h2>
        <button
          onClick={refreshPrices}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <Wallet size={16} />
            <span className="text-sm">Open Positions</span>
          </div>
          <div className="text-2xl font-bold text-white">{positions.length}</div>
        </div>

        <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <TrendingUp size={16} />
            <span className="text-sm">Open P&L</span>
          </div>
          <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
          </div>
        </div>

        <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <Percent size={16} />
            <span className="text-sm">Win Rate</span>
          </div>
          <div className="text-2xl font-bold text-white">{winRate}%</div>
        </div>

        <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <Target size={16} />
            <span className="text-sm">Profit Factor</span>
          </div>
          <div className="text-2xl font-bold text-purple-400">{profitFactor}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'open', label: `📊 Open Positions (${positions.length})` },
          { id: 'closed', label: `✅ Closed Trades (${closedTrades.length})` },
          { id: 'stats', label: '📈 Statistics' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === tab.id 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Open Positions */}
      {activeTab === 'open' && (
        <div className="space-y-3">
          {positions.map(position => (
            <div
              key={position.id}
              className="p-4 bg-gray-900/50 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        position.type === 'buy' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                      }`}>
                        {position.type.toUpperCase()}
                      </span>
                      <span className="text-white font-bold">{position.pair}</span>
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      {position.lotSize} lots • {position.openDate.toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Entry</div>
                    <div className="text-white font-mono">{position.entryPrice.toFixed(4)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Current</div>
                    <div className="text-white font-mono">{position.currentPrice.toFixed(4)}</div>
                  </div>
                  <div className="text-right min-w-[100px]">
                    <div className="text-xs text-gray-500">P&L</div>
                    <div className={`text-lg font-bold ${position.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {position.profit >= 0 ? '+' : ''}${position.profit.toFixed(2)}
                    </div>
                    <div className={`text-xs ${position.profitPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {position.profitPercent >= 0 ? '+' : ''}{position.profitPercent.toFixed(2)}%
                    </div>
                  </div>
                  <button
                    onClick={() => closePosition(position.id)}
                    className="p-2 bg-gray-800 hover:bg-red-900/50 hover:text-red-400 rounded-lg transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* SL/TP */}
              {(position.stopLoss || position.takeProfit) && (
                <div className="flex gap-6 mt-3 pt-3 border-t border-gray-800">
                  {position.stopLoss && (
                    <div className="text-sm">
                      <span className="text-gray-500">SL: </span>
                      <span className="text-red-400 font-mono">{position.stopLoss.toFixed(4)}</span>
                    </div>
                  )}
                  {position.takeProfit && (
                    <div className="text-sm">
                      <span className="text-gray-500">TP: </span>
                      <span className="text-green-400 font-mono">{position.takeProfit.toFixed(4)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {positions.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Wallet size={48} className="mx-auto mb-4 opacity-50" />
              <p>No open positions</p>
              <p className="text-sm">Start trading to see your positions here</p>
            </div>
          )}
        </div>
      )}

      {/* Closed Trades */}
      {activeTab === 'closed' && (
        <div className="space-y-3">
          {closedTrades.map(trade => (
            <div
              key={trade.id}
              className="p-4 bg-gray-900/50 rounded-xl border border-gray-800"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        trade.type === 'buy' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                      }`}>
                        {trade.type.toUpperCase()}
                      </span>
                      <span className="text-white font-bold">{trade.pair}</span>
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      {trade.lotSize} lots • {trade.duration}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Entry → Exit</div>
                    <div className="text-white font-mono text-sm">
                      {trade.entryPrice.toFixed(4)} → {trade.exitPrice.toFixed(4)}
                    </div>
                  </div>
                  <div className="text-right min-w-[100px]">
                    <div className={`text-lg font-bold ${trade.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}
                    </div>
                    <div className={`text-xs ${trade.profitPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {trade.profitPercent >= 0 ? '+' : ''}{trade.profitPercent.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Statistics */}
      {activeTab === 'stats' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Performance Summary */}
          <div className="p-6 bg-gray-900/50 rounded-xl border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">📊 Performance Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Closed P&L</span>
                <span className={`text-xl font-bold ${totalClosedProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalClosedProfit >= 0 ? '+' : ''}${totalClosedProfit.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Winning Trades</span>
                <span className="text-green-400 font-bold">{winningTrades.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Losing Trades</span>
                <span className="text-red-400 font-bold">{losingTrades.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Win Rate</span>
                <span className="text-white font-bold">{winRate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Average Win</span>
                <span className="text-green-400 font-mono">${avgWin.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Average Loss</span>
                <span className="text-red-400 font-mono">${avgLoss.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Profit Factor</span>
                <span className="text-purple-400 font-bold">{profitFactor}</span>
              </div>
            </div>
          </div>

          {/* Risk Metrics */}
          <div className="p-6 bg-gray-900/50 rounded-xl border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">⚠️ Risk Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Risk/Reward Ratio</span>
                <span className="text-white font-bold">1:1.5</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Best Trade</span>
                <span className="text-green-400 font-mono">
                  +${Math.max(...closedTrades.map(t => t.profit), 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Worst Trade</span>
                <span className="text-red-400 font-mono">
                  -${Math.abs(Math.min(...closedTrades.map(t => t.profit), 0)).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Consecutive Wins</span>
                <span className="text-white font-bold">3</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Consecutive Losses</span>
                <span className="text-white font-bold">1</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PortfolioTracker

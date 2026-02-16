import { useState, useEffect } from 'react'
import { Newspaper, ExternalLink, Calendar, TrendingUp, TrendingDown, DollarSign, Building, Globe, AlertTriangle } from 'lucide-react'

interface NewsItem {
  id: string
  title: string
  description: string
  source: string
  publishedAt: string
  url: string
  category: string
  impact: 'high' | 'medium' | 'low'
  currency?: string
}

const economicCalendar: { date: string; event: string; currency: string; impact: 'high' | 'medium' | 'low'; forecast: string }[] = [
  { date: '2026-02-17', event: 'US Retail Sales', currency: 'USD', impact: 'high', forecast: '0.6%' },
  { date: '2026-02-17', event: 'US Inflation Expectations', currency: 'USD', impact: 'medium', forecast: '2.9%' },
  { date: '2026-02-18', event: 'ECB President Lagarde Speech', currency: 'EUR', impact: 'high', forecast: '' },
  { date: '2026-02-18', event: 'US Building Permits', currency: 'USD', impact: 'medium', forecast: '1.45M' },
  { date: '2026-02-19', event: 'US Initial Jobless Claims', currency: 'USD', impact: 'high', forecast: '215K' },
  { date: '2026-02-19', event: 'US Existing Home Sales', currency: 'USD', impact: 'medium', forecast: '4.10M' },
  { date: '2026-02-20', event: 'US Fed Meeting Minutes', currency: 'USD', impact: 'high', forecast: '' },
  { date: '2026-02-20', event: 'UK CPI', currency: 'GBP', impact: 'high', forecast: '3.0%' },
  { date: '2026-02-21', event: 'US New Home Sales', currency: 'USD', impact: 'medium', forecast: '680K' },
  { date: '2026-02-21', event: 'ECB Lane Speech', currency: 'EUR', impact: 'medium', forecast: '' },
  { date: '2026-02-24', event: 'US Durable Goods Orders', currency: 'USD', impact: 'high', forecast: '2.0%' },
  { date: '2026-02-24', event: 'US GDP Growth Rate', currency: 'USD', impact: 'high', forecast: '2.3%' },
  { date: '2026-02-25', event: 'US PCE Price Index', currency: 'USD', impact: 'high', forecast: '2.4%' },
  { date: '2026-02-25', event: 'UK GDP', currency: 'GBP', impact: 'high', forecast: '0.1%' },
  { date: '2026-02-26', event: 'US Personal Spending', currency: 'USD', impact: 'medium', forecast: '0.3%' },
  { date: '2026-02-26', event: 'US Consumer Sentiment', currency: 'USD', impact: 'medium', forecast: '79.0' },
  { date: '2026-02-27', event: 'US Non-Farm Payrolls', currency: 'USD', impact: 'high', forecast: '185K' },
  { date: '2026-02-27', event: 'US Unemployment Rate', currency: 'USD', impact: 'high', forecast: '4.0%' },
]

// Generate realistic forex news
const generateNews = (): NewsItem[] => {
  const now = new Date()
  const news: NewsItem[] = [
    {
      id: '1',
      title: 'Fed Signals Potential Rate Cuts in Coming Months',
      description: 'Federal Reserve officials indicated they may begin cutting interest rates if inflation continues to moderate, boosting market sentiment.',
      source: 'Reuters',
      publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      url: '#',
      category: 'Monetary Policy',
      impact: 'high',
      currency: 'USD'
    },
    {
      id: '2',
      title: 'ECB Maintains Hawkish Stance on Inflation',
      description: 'European Central Bank officials emphasized that fighting inflation remains their top priority, supporting the euro.',
      source: 'Bloomberg',
      publishedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      url: '#',
      category: 'Monetary Policy',
      impact: 'high',
      currency: 'EUR'
    },
    {
      id: '3',
      title: 'Bank of Japan Considers Policy Normalization',
      description: 'BOJ officials are discussing plans to phase out negative interest rates, potentially strengthening the yen.',
      source: 'Financial Times',
      publishedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
      url: '#',
      category: 'Monetary Policy',
      impact: 'high',
      currency: 'JPY'
    },
    {
      id: '4',
      title: 'US Dollar Weakens After Retail Sales Data',
      description: 'Better-than-expected retail sales data initially boosted USD but momentum faded as investors focused on Fed outlook.',
      source: 'CNBC',
      publishedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
      url: '#',
      category: 'Economic Data',
      impact: 'medium',
      currency: 'USD'
    },
    {
      id: '5',
      title: 'Eurozone GDP Growth Beats Expectations',
      description: 'EU economic growth came in at 0.3% quarterly, exceeding forecasts and supporting the single currency.',
      source: 'WSJ',
      publishedAt: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(),
      url: '#',
      category: 'Economic Data',
      impact: 'medium',
      currency: 'EUR'
    },
    {
      id: '6',
      title: 'UK Inflation Falls to 3-Year Low',
      description: 'British consumer prices rose 3.0% year-over-year, the lowest since 2021, boosting hopes for BOE rate cuts.',
      source: 'Reuters',
      publishedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      url: '#',
      category: 'Economic Data',
      impact: 'high',
      currency: 'GBP'
    },
    {
      id: '7',
      title: 'Australian Dollar Rises on Strong Trade Data',
      description: 'Australia posted a larger-than-expected trade surplus as commodity exports remained robust.',
      source: 'Bloomberg',
      publishedAt: new Date(now.getTime() - 14 * 60 * 60 * 1000).toISOString(),
      url: '#',
      category: 'Economic Data',
      impact: 'medium',
      currency: 'AUD'
    },
    {
      id: '8',
      title: 'China Imports Surge, Boosting Asia Currencies',
      description: 'Chinese imports rose sharply, signaling stronger domestic demand and supporting regional currencies.',
      source: 'Financial Times',
      publishedAt: new Date(now.getTime() - 16 * 60 * 60 * 1000).toISOString(),
      url: '#',
      category: 'Trade',
      impact: 'medium',
      currency: 'CNY'
    },
    {
      id: '9',
      title: 'Swiss Franc Strengthens on Safe Haven Flows',
      description: 'Geopolitical uncertainty drove investors to Swiss assets, pushing CHF higher against major currencies.',
      source: 'CNBC',
      publishedAt: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString(),
      url: '#',
      category: 'Market Analysis',
      impact: 'low',
      currency: 'CHF'
    },
    {
      id: '10',
      title: 'Canadian Dollar Steady Ahead of Rate Decision',
      description: 'CAD traders await Bank of Canada decision with most analysts expecting rates to stay on hold.',
      source: 'Bloomberg',
      publishedAt: new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString(),
      url: '#',
      category: 'Monetary Policy',
      impact: 'medium',
      currency: 'CAD'
    },
    {
      id: '11',
      title: 'US Treasury Yields Fall on Fed Outlook',
      description: 'Bond yields declined as markets adjusted expectations for Fed policy path.',
      source: 'Reuters',
      publishedAt: new Date(now.getTime() - 22 * 60 * 60 * 1000).toISOString(),
      url: '#',
      category: 'Fixed Income',
      impact: 'medium',
      currency: 'USD'
    },
    {
      id: '12',
      title: 'New Zealand Dollar Volatile After GDP Data',
      description: 'NZD swung wildly after GDP showed the economy contracted in Q4.',
      source: 'WSJ',
      publishedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      url: '#',
      category: 'Economic Data',
      impact: 'medium',
      currency: 'NZD'
    },
  ]
  return news
}

const impactColors = {
  high: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
  low: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' }
}

const currencyFlags: Record<string, string> = {
  USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵', CHF: '🇨🇭', AUD: '🇦🇺', CAD: '🇨🇦', NZD: '🇳🇿', CNY: '🇨🇳'
}

const categoryIcons: Record<string, any> = {
  'Monetary Policy': DollarSign,
  'Economic Data': TrendingUp,
  'Trade': Globe,
  'Fixed Income': Building,
  'Market Analysis': TrendingDown
}

export default function MarketNews() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all')

  useEffect(() => {
    const loadNews = async () => {
      setLoading(true)
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
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

  const categories = ['all', ...Array.from(new Set(news.map(n => n.category)))]
  const currencies = ['all', ...Array.from(new Set(news.filter(n => n.currency).map(n => n.currency!)))]

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading market news...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Economic Calendar */}
      <div className="chart-card">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="text-blue-600" size={20} />
          <h3 className="text-lg font-semibold text-gray-900">Economic Calendar - Upcoming Events</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Date</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Event</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Currency</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Impact</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Forecast</th>
              </tr>
            </thead>
            <tbody>
              {economicCalendar.slice(0, 10).map((event, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-2 text-sm text-gray-700">{event.date}</td>
                  <td className="py-3 px-2 text-sm font-medium text-gray-900">{event.event}</td>
                  <td className="py-3 px-2 text-sm">
                    <span className="flex items-center gap-1">
                      <span>{currencyFlags[event.currency]}</span>
                      <span>{event.currency}</span>
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${impactColors[event.impact].bg} ${impactColors[event.impact].text}`}>
                      {event.impact.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-sm text-gray-600">{event.forecast || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            {currencies.map(curr => (
              <option key={curr} value={curr}>
                {curr === 'all' ? 'All Currencies' : `${currencyFlags[curr] || ''} ${curr}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* News Grid */}
      <div className="grid gap-4">
        {filteredNews.map(item => {
          const Icon = categoryIcons[item.category] || Newspaper
          return (
            <div key={item.id} className="chart-card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${impactColors[item.impact].bg} ${impactColors[item.impact].text}`}>
                      {item.impact.toUpperCase()} IMPACT
                    </span>
                    {item.currency && (
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        {currencyFlags[item.currency]} {item.currency}
                      </span>
                    )}
                    <span className="text-sm text-gray-400">•</span>
                    <span className="text-sm text-gray-500">{item.source}</span>
                    <span className="text-sm text-gray-400">•</span>
                    <span className="text-sm text-gray-500">{formatTime(item.publishedAt)}</span>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h4>
                  <p className="text-gray-600 mb-3">{item.description}</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Icon size={14} />
                      <span>{item.category}</span>
                    </div>
                    <a href={item.url} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
                      Read more <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredNews.length === 0 && (
        <div className="text-center py-12">
          <Newspaper className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500">No news articles match your filters.</p>
        </div>
      )}
    </div>
  )
}

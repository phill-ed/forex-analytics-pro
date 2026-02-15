import { useState, useEffect } from 'react'
import { 
  Globe, RefreshCw, Settings, Plus, Trash2, 
  Play, Pause, ExternalLink, AlertCircle, CheckCircle,
  BarChart2, Activity, TrendingUp, TrendingDown
} from 'lucide-react'

// Types
interface Website {
  id: number
  name: string
  url: string
  category: string
  is_active: boolean
  sentiment_method: string
}

interface Article {
  id: number
  title: string
  content: string
  url: string
  scraped_at: string
  sentiment: string
  sentiment_score: number
  category: string
  website_name?: string
}

interface ScrapeLog {
  id: number
  action: string
  message: string
  created_at: string
  articles_scraped: number
}

interface Stats {
  total_websites: number
  active_websites: number
  total_articles: number
  sentiment_distribution: {
    positive: number
    neutral: number
    negative: number
  }
}

// API Base URL - configure this to your Flask server
const API_BASE = 'http://localhost:5000'

// Demo mode when API is not available
const DEMO_MODE = true

const WebScraper = () => {
  const [websites, setWebsites] = useState<Website[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [logs, setLogs] = useState<ScrapeLog[]>([])
  const [activeTab, setActiveTab] = useState<'news' | 'websites' | 'scrape' | 'settings'>('news')
  const [isLoading, setIsLoading] = useState(false)
  const [isScraping, setIsScraping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterSentiment, setFilterSentiment] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Demo data
  const demoWebsites: Website[] = [
    { id: 1, name: 'Reuters Business', url: 'https://www.reuters.com', category: 'Business', is_active: true, sentiment_method: 'keyword' },
    { id: 2, name: 'Bloomberg', url: 'https://www.bloomberg.com', category: 'Finance', is_active: true, sentiment_method: 'textblob' },
    { id: 3, name: 'Forex Factory', url: 'https://www.forexfactory.com', category: 'Forex', is_active: true, sentiment_method: 'vader' },
    { id: 4, name: 'FX Street', url: 'https://www.fxstreet.com', category: 'Forex', is_active: true, sentiment_method: 'keyword' },
    { id: 5, name: 'Investing.com', url: 'https://www.investing.com', category: 'Finance', is_active: false, sentiment_method: 'textblob' },
  ]

  const demoArticles: Article[] = [
    { id: 1, title: 'Fed signals rates could stay higher for longer amid strong economic data', content: 'The Federal Reserve indicated that interest rates may remain higher for an extended period...', url: '#', scraped_at: new Date().toISOString(), sentiment: 'negative', sentiment_score: -0.6, category: 'central-bank', website_name: 'Reuters Business' },
    { id: 2, title: 'EUR/USD rises to 1.0850 as Eurozone CPI shows signs of cooling', content: 'The euro gained ground against the dollar as inflation data suggested the ECB may pause rate hikes...', url: '#', scraped_at: new Date().toISOString(), sentiment: 'positive', sentiment_score: 0.7, category: 'forex', website_name: 'Forex Factory' },
    { id: 3, title: 'Asian markets mixed ahead of US jobs data', content: 'Asian stock markets showed mixed performance as investors awaited key US employment figures...', url: '#', scraped_at: new Date().toISOString(), sentiment: 'neutral', sentiment_score: 0.1, category: 'markets', website_name: 'Bloomberg' },
    { id: 4, title: 'Bank of England holds rates steady, warns on inflation', content: 'The BoE maintained its benchmark rate but warned that inflation remains a concern...', url: '#', scraped_at: new Date().toISOString(), sentiment: 'neutral', sentiment_score: -0.2, category: 'central-bank', website_name: 'Reuters Business' },
    { id: 5, title: 'Australian dollar surges after strong employment data', content: 'The AUD rallied sharply after the latest employment report beat expectations...', url: '#', scraped_at: new Date().toISOString(), sentiment: 'positive', sentiment_score: 0.8, category: 'forex', website_name: 'FX Street' },
    { id: 6, title: 'China manufacturing PMI contracts, raising growth concerns', content: 'Official data showed factory activity shrank for the third consecutive month...', url: '#', scraped_at: new Date().toISOString(), sentiment: 'negative', sentiment_score: -0.7, category: 'economy', website_name: 'Bloomberg' },
    { id: 7, title: 'Japanese yen weakens as Bank of Japan maintains dovish stance', content: 'The JPY fell to multi-month lows as the BOJ stuck with its ultra-loose monetary policy...', url: '#', scraped_at: new Date().toISOString(), sentiment: 'negative', sentiment_score: -0.5, category: 'forex', website_name: 'FX Street' },
    { id: 8, title: 'European stocks hit record high on optimism over earnings', content: 'The STOXX 600 index reached unprecedented levels amid strong corporate results...', url: '#', scraped_at: new Date().toISOString(), sentiment: 'positive', sentiment_score: 0.6, category: 'markets', website_name: 'Reuters Business' },
  ]

  const demoStats: Stats = {
    total_websites: 5,
    active_websites: 4,
    total_articles: 847,
    sentiment_distribution: { positive: 312, neutral: 389, negative: 146 }
  }

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      if (DEMO_MODE) {
        // Use demo data
        setWebsites(demoWebsites)
        setArticles(demoArticles)
        setStats(demoStats)
      } else {
        // Fetch from API
        const [websitesRes, articlesRes, statsRes] = await Promise.all([
          fetch(`${API_BASE}/api/websites`),
          fetch(`${API_BASE}/api/news?per_page=50`),
          fetch(`${API_BASE}/api/stats`)
        ])
        
        if (!websitesRes.ok || !articlesRes.ok || !statsRes.ok) {
          throw new Error('Failed to fetch data from API')
        }
        
        const websitesData = await websitesRes.json()
        const articlesData = await articlesRes.json()
        const statsData = await statsRes.json()
        
        setWebsites(websitesData)
        setArticles(articlesData.articles || [])
        setStats(statsData)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Could not connect to scraper API. Using demo data.')
      // Fallback to demo data
      setWebsites(demoWebsites)
      setArticles(demoArticles)
      setStats(demoStats)
    } finally {
      setIsLoading(false)
    }
  }

  const scrapeAll = async () => {
    setIsScraping(true)
    try {
      if (!DEMO_MODE) {
        const res = await fetch(`${API_BASE}/scrape/all`)
        if (res.ok) {
          await fetchData() // Refresh data
        }
      } else {
        // Simulate scraping
        await new Promise(resolve => setTimeout(resolve, 2000))
        setArticles(prev => [...demoArticles, ...prev].slice(0, 50))
      }
    } catch (err) {
      console.error('Scraping error:', err)
    } finally {
      setIsScraping(false)
    }
  }

  const scrapeWebsite = async (websiteId: number) => {
    setIsScraping(true)
    try {
      if (!DEMO_MODE) {
        await fetch(`${API_BASE}/scrape/${websiteId}`)
        await fetchData()
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    } catch (err) {
      console.error('Scraping error:', err)
    } finally {
      setIsScraping(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredArticles = articles.filter(article => {
    if (filterSentiment !== 'all' && article.sentiment !== filterSentiment) return false
    if (filterCategory !== 'all' && article.category !== filterCategory) return false
    if (searchTerm && !article.title.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const categories = [...new Set(articles.map(a => a.category).filter(Boolean))]

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-900/50 text-green-400 border-green-700'
      case 'negative': return 'bg-red-900/50 text-red-400 border-red-700'
      default: return 'bg-gray-800/50 text-gray-400 border-gray-700'
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp size={16} />
      case 'negative': return <TrendingDown size={16} />
      default: return <Activity size={16} />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            🕷️ Web Scraper
          </h2>
          <p className="text-gray-400 text-sm">
            {DEMO_MODE ? 'Demo Mode - Configure API_BASE in code for real data' : 'Connected to Flask API'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={scrapeAll}
            disabled={isScraping}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors"
          >
            {isScraping ? <Pause size={18} /> : <Play size={18} />}
            {isScraping ? 'Scraping...' : 'Scrape All'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Globe size={16} />
              <span className="text-sm">Total Websites</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.total_websites}</div>
            <div className="text-xs text-green-400">{stats.active_websites} active</div>
          </div>
          
          <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <BarChart2 size={16} />
              <span className="text-sm">Total Articles</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.total_articles}</div>
          </div>
          
          <div className="p-4 bg-green-900/30 rounded-xl border border-green-800">
            <div className="flex items-center gap-2 text-green-400 mb-1">
              <TrendingUp size={16} />
              <span className="text-sm">Positive</span>
            </div>
            <div className="text-2xl font-bold text-green-400">{stats.sentiment_distribution.positive}</div>
          </div>
          
          <div className="p-4 bg-red-900/30 rounded-xl border border-red-800">
            <div className="flex items-center gap-2 text-red-400 mb-1">
              <TrendingDown size={16} />
              <span className="text-sm">Negative</span>
            </div>
            <div className="text-2xl font-bold text-red-400">{stats.sentiment_distribution.negative}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'news', label: '📰 Scraped News' },
          { id: 'websites', label: '🌐 Websites' },
          { id: 'scrape', label: '⚙️ Scrape Logs' },
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

      {/* News Tab */}
      {activeTab === 'news' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2"
            />
            
            <select
              value={filterSentiment}
              onChange={(e) => setFilterSentiment(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2"
            >
              <option value="all">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
            
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Articles List */}
          <div className="space-y-3">
            {filteredArticles.map(article => (
              <div
                key={article.id}
                className="p-4 bg-gray-900/50 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs text-gray-500">
                        {article.website_name || article.category}
                      </span>
                      <span className="text-xs text-gray-600">•</span>
                      <span className="text-xs text-gray-500">
                        {new Date(article.scraped_at).toLocaleDateString()}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs capitalize border ${getSentimentColor(article.sentiment)}`}>
                        {getSentimentIcon(article.sentiment)}
                        <span className="ml-1">{article.sentiment}</span>
                      </span>
                    </div>
                    <h3 className="text-white font-medium mb-2">{article.title}</h3>
                    <p className="text-gray-400 text-sm line-clamp-2">{article.content}</p>
                  </div>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <ExternalLink size={16} className="text-gray-400" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {filteredArticles.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No articles found matching your filters.
            </div>
          )}
        </div>
      )}

      {/* Websites Tab */}
      {activeTab === 'websites' && (
        <div className="space-y-4">
          <div className="grid gap-4">
            {websites.map(website => (
              <div
                key={website.id}
                className="p-4 bg-gray-900/50 rounded-xl border border-gray-800"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-white font-medium">{website.name}</h3>
                      {website.is_active ? (
                        <span className="flex items-center gap-1 text-xs text-green-400">
                          <CheckCircle size={12} /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Pause size={12} /> Inactive
                        </span>
                      )}
                    </div>
                    <a
                      href={website.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-500 hover:text-purple-400 flex items-center gap-1"
                    >
                      {website.url} <ExternalLink size={12} />
                    </a>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Category</div>
                      <div className="text-white text-sm">{website.category}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Sentiment</div>
                      <div className="text-white text-sm capitalize">{website.sentiment_method}</div>
                    </div>
                    <button
                      onClick={() => scrapeWebsite(website.id)}
                      disabled={isScraping || !website.is_active}
                      className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Play size={16} className="text-purple-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scrape Logs Tab */}
      {activeTab === 'scrape' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-900/30 rounded-xl border border-blue-800">
            <div className="flex items-center gap-2 text-blue-400">
              <AlertCircle size={18} />
              <span>
                To enable real scraping, run the Flask app: 
                <code className="ml-2 px-2 py-1 bg-gray-800 rounded">cd /root/.openclaw/workspace/news-scraper-app && python app.py</code>
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="p-3 bg-green-900/30 rounded-lg border border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-green-400 font-medium">Success</span>
                  <span className="text-gray-400 ml-2">- Scraped 12 articles from Forex Factory</span>
                </div>
                <span className="text-gray-500 text-sm">2 hours ago</span>
              </div>
            </div>
            <div className="p-3 bg-green-900/30 rounded-lg border border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-green-400 font-medium">Success</span>
                  <span className="text-gray-400 ml-2">- Scraped 8 articles from Reuters</span>
                </div>
                <span className="text-gray-500 text-sm">3 hours ago</span>
              </div>
            </div>
            <div className="p-3 bg-yellow-900/30 rounded-lg border border-yellow-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-yellow-400 font-medium">Warning</span>
                  <span className="text-gray-400 ml-2">- Rate limited from Bloomberg</span>
                </div>
                <span className="text-gray-500 text-sm">5 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WebScraper

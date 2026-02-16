// Real Forex API Service for React App

const FOREX_API = {
  base: 'https://api.frankfurter.app',
  
  // Get latest rates
  getRates: async function(baseCurrency = 'USD') {
    try {
      const response = await fetch(
        `${this.base}/latest?from=${baseCurrency}`
      )
      const data = await response.json()
      return data.rates || {}
    } catch (error) {
      console.error('Error fetching rates:', error)
      return this.getSampleRates()
    }
  },
  
  // Get historical data
  getHistoricalData: async function(base: string, quote: string, periods = 30) {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - periods)
      
      const response = await fetch(
        `${this.base}/${startDate.toISOString().split('T')[0]}..${endDate.toISOString().split('T')[0]}?from=${base}&to=${quote}`
      )
      const data = await response.json()
      
      if (data.rates) {
        const prices: number[] = []
        Object.entries(data.rates).forEach(([date, rate]: [string, any]) => {
          if (rate[quote]) prices.push(rate[quote])
        })
        return prices
      }
      return []
    } catch (error) {
      console.error('Error fetching historical data:', error)
      return []
    }
  },
  
  // Sample rates for fallback
  getSampleRates: function() {
    return {
      EUR: 1,
      USD: 1.085,
      GBP: 0.865,
      JPY: 163.5,
      CHF: 0.912,
      AUD: 1.655,
      CAD: 1.475,
      NZD: 1.785
    }
  }
}

export default FOREX_API

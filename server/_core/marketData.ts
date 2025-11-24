/**
 * Market Data Service
 * 
 * Integrates with free market data APIs to fetch real-time prices for:
 * - ASX stocks (Australian Securities Exchange)
 * - B3 stocks and FIIs (Brazilian Stock Exchange)
 * - US stocks
 * - Cryptocurrencies
 * 
 * APIs Used (all free tier):
 * - Alpha Vantage: https://www.alphavantage.co/ (free 25 req/day)
 * - Yahoo Finance (via unofficial API): unlimited, but rate limited
 * - CoinGecko: https://www.coingecko.com/en/api (free tier)
 * 
 * CONFIGURATION:
 * Set ALPHA_VANTAGE_API_KEY in your .env file (get free key at alphavantage.co)
 * Set COINGECKO_API_KEY in your .env file (optional, free tier works without key)
 */

import { eq, and } from 'drizzle-orm';
import { priceCache } from '../../drizzle/schema';
import { getDb } from '../db';

// Cache duration in milliseconds (15 minutes)
const CACHE_DURATION_MS = 15 * 60 * 1000;

// API Keys (get from environment)
const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'demo';

export type MarketQuote = {
  symbol: string;
  market: string;
  price: number; // In cents
  currency: string;
  lastUpdated: Date;
  source: string;
};

/**
 * Get quote for a symbol from cache or API
 */
export async function getQuote(symbol: string, market: string): Promise<MarketQuote | null> {
  // Check cache first
  const cached = await getCachedPrice(symbol, market);
  if (cached && Date.now() - cached.lastUpdated.getTime() < CACHE_DURATION_MS) {
    console.log(`[MarketData] Using cached price for ${symbol} (${market})`);
    return cached;
  }

  // Fetch from API based on market
  let quote: MarketQuote | null = null;

  try {
    switch (market) {
      case 'ASX':
        quote = await fetchASXQuote(symbol);
        break;
      case 'B3':
        quote = await fetchB3Quote(symbol);
        break;
      case 'US':
        quote = await fetchUSQuote(symbol);
        break;
      case 'CRYPTO':
        quote = await fetchCryptoQuote(symbol);
        break;
      default:
        console.warn(`[MarketData] Unknown market: ${market}`);
        return null;
    }

    // Update cache if we got a quote
    if (quote) {
      await updateCache(quote);
    }

    return quote;
  } catch (error) {
    console.error(`[MarketData] Error fetching quote for ${symbol}:`, error);
    // Return stale cache if available
    return cached || null;
  }
}

/**
 * Fetch ASX (Australian) stock quote
 * Uses Yahoo Finance API
 */
async function fetchASXQuote(symbol: string): Promise<MarketQuote | null> {
  const fullSymbol = symbol.endsWith('.AX') ? symbol : `${symbol}.AX`;
  
  try {
    // Using Yahoo Finance v8 API (free, no key needed)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${fullSymbol}?interval=1d`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result || !result.meta) {
      return null;
    }

    const price = result.meta.regularMarketPrice;
    const currency = result.meta.currency || 'AUD';

    return {
      symbol: fullSymbol,
      market: 'ASX',
      price: Math.round(price * 100), // Convert to cents
      currency,
      lastUpdated: new Date(),
      source: 'yahoo_finance',
    };
  } catch (error) {
    console.error(`[MarketData] Error fetching ASX quote for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch B3 (Brazilian) stock/FII quote
 * Uses Yahoo Finance API with .SA suffix
 */
async function fetchB3Quote(symbol: string): Promise<MarketQuote | null> {
  const fullSymbol = symbol.endsWith('.SA') ? symbol : `${symbol}.SA`;
  
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${fullSymbol}?interval=1d`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result || !result.meta) {
      return null;
    }

    const price = result.meta.regularMarketPrice;
    const currency = result.meta.currency || 'BRL';

    return {
      symbol: fullSymbol,
      market: 'B3',
      price: Math.round(price * 100), // Convert to cents
      currency,
      lastUpdated: new Date(),
      source: 'yahoo_finance',
    };
  } catch (error) {
    console.error(`[MarketData] Error fetching B3 quote for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch US stock quote
 * Uses Alpha Vantage API (requires free API key)
 */
async function fetchUSQuote(symbol: string): Promise<MarketQuote | null> {
  if (ALPHA_VANTAGE_KEY === 'demo') {
    console.warn('[MarketData] Alpha Vantage API key not set, using demo key with limited symbols');
  }

  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }

    const data = await response.json();
    const quote = data['Global Quote'];
    
    if (!quote || !quote['05. price']) {
      // Fallback to Yahoo Finance
      return fetchYahooQuote(symbol, 'US');
    }

    const price = parseFloat(quote['05. price']);

    return {
      symbol,
      market: 'US',
      price: Math.round(price * 100), // Convert to cents
      currency: 'USD',
      lastUpdated: new Date(),
      source: 'alpha_vantage',
    };
  } catch (error) {
    console.error(`[MarketData] Error fetching US quote for ${symbol}:`, error);
    // Fallback to Yahoo Finance
    return fetchYahooQuote(symbol, 'US');
  }
}

/**
 * Fallback: Fetch quote from Yahoo Finance (works for most markets)
 */
async function fetchYahooQuote(symbol: string, market: string): Promise<MarketQuote | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result || !result.meta) {
      return null;
    }

    const price = result.meta.regularMarketPrice;
    const currency = result.meta.currency || 'USD';

    return {
      symbol,
      market,
      price: Math.round(price * 100),
      currency,
      lastUpdated: new Date(),
      source: 'yahoo_finance',
    };
  } catch (error) {
    console.error(`[MarketData] Error fetching Yahoo quote for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch cryptocurrency quote
 * Uses CoinGecko API (free, no key required for basic usage)
 */
async function fetchCryptoQuote(symbol: string): Promise<MarketQuote | null> {
  // Map common symbols to CoinGecko IDs
  const symbolMap: Record<string, string> = {
    'BTC': 'bitcoin',
    'BTC-USD': 'bitcoin',
    'ETH': 'ethereum',
    'ETH-USD': 'ethereum',
    'USDT': 'tether',
    'BNB': 'binancecoin',
    'SOL': 'solana',
    'ADA': 'cardano',
    'XRP': 'ripple',
    'DOT': 'polkadot',
    'DOGE': 'dogecoin',
    'AVAX': 'avalanche-2',
    'MATIC': 'matic-network',
    'LINK': 'chainlink',
  };

  const cleanSymbol = symbol.replace('-USD', '').toUpperCase();
  const coinId = symbolMap[cleanSymbol] || cleanSymbol.toLowerCase();

  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const price = data[coinId]?.usd;
    
    if (!price) {
      return null;
    }

    return {
      symbol: cleanSymbol,
      market: 'CRYPTO',
      price: Math.round(price * 100), // Convert to cents
      currency: 'USD',
      lastUpdated: new Date(),
      source: 'coingecko',
    };
  } catch (error) {
    console.error(`[MarketData] Error fetching crypto quote for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get cached price from database
 */
async function getCachedPrice(symbol: string, market: string): Promise<MarketQuote | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const cached = await db
      .select()
      .from(priceCache)
      .where(and(eq(priceCache.symbol, symbol), eq(priceCache.market, market)))
      .limit(1);

    if (cached.length === 0) {
      return null;
    }

    const item = cached[0];
    return {
      symbol: item.symbol,
      market: item.market,
      price: item.price,
      currency: item.currency,
      lastUpdated: item.lastUpdated,
      source: 'cache',
    };
  } catch (error) {
    console.error('[MarketData] Error reading cache:', error);
    return null;
  }
}

/**
 * Update price cache in database
 */
async function updateCache(quote: MarketQuote): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    // Check if entry exists
    const existing = await db
      .select()
      .from(priceCache)
      .where(and(eq(priceCache.symbol, quote.symbol), eq(priceCache.market, quote.market)))
      .limit(1);

    if (existing.length > 0) {
      // Update existing
      await db
        .update(priceCache)
        .set({
          price: quote.price,
          currency: quote.currency,
          lastUpdated: quote.lastUpdated,
        })
        .where(and(eq(priceCache.symbol, quote.symbol), eq(priceCache.market, quote.market)));
    } else {
      // Insert new
      await db.insert(priceCache).values({
        symbol: quote.symbol,
        market: quote.market,
        price: quote.price,
        currency: quote.currency,
        lastUpdated: quote.lastUpdated,
      });
    }
  } catch (error) {
    console.error('[MarketData] Error updating cache:', error);
  }
}

/**
 * Batch update prices for multiple positions
 */
export async function batchUpdatePrices(
  positions: Array<{ symbol: string; market: string }>
): Promise<Map<string, MarketQuote>> {
  const results = new Map<string, MarketQuote>();

  // Update prices sequentially to avoid rate limiting
  for (const pos of positions) {
    const key = `${pos.symbol}-${pos.market}`;
    const quote = await getQuote(pos.symbol, pos.market);
    
    if (quote) {
      results.set(key, quote);
    }
    
    // Small delay to avoid hitting rate limits
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return results;
}

// Service to interact with the CoinGecko API
// Using a CORS proxy as fallback for non-CORS endpoints

// Base URL for the CoinGecko API
const API_BASE_URL = 'https://api.coingecko.com/api/v3';

// Public endpoint that supports CORS
const PUBLIC_API_URL = 'https://api.coingecko.com/api/v3';

// Simple CORS proxy as fallback (not all endpoints support CORS)
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// Get cryptocurrency icon URL
export function getCryptoIconUrl(coinId, size = 'small') {
  if (!coinId) return '';
  
  const id = coinId.toLowerCase();
  const sizes = {
    small: '32',
    medium: '64',
    large: '128'
  };
  
  const sizeParam = sizes[size] || sizes.small;
  
  // Get CoinGecko ID for more reliable icon fetching
  const coinData = getCoinData(id);
  const coinGeckoId = coinData?.id || id;
  
  // Try multiple icon sources in order of reliability
  const sources = [
    // CoinGecko (supports most coins)
    `https://assets.coingecko.com/coins/images/1/large/bitcoin.png?1547033579`,
    // Fallback to CoinMarketCap
    `https://s2.coinmarketcap.com/static/img/coins/64x64/${getCoinMarketCapId(id)}.png`,
    // Fallback to trusted CDN with CORS support
    `https://cryptoicons.org/api/icon/${id.toLowerCase()}/200`,
    // Fallback to our own assets if available
    `/img/crypto/${id}.png`
  ];
  
  // If we have a valid CoinGecko ID, use their CDN
  if (coinGeckoId) {
    sources.unshift(`https://assets.coingecko.com/coins/images/1/large/bitcoin.png?1547033579`);
  }
  
  // Return the most reliable source
  return sources[0];
}

// Helper function to get CoinMarketCap ID
function getCoinMarketCapId(coinId) {
  // Add more mappings as needed
  const cmcIds = {
    'btc': '1',
    'eth': '1027',
    'usdt': '825',
    'usdc': '3408',
    'bnb': '1839',
    'xrp': '52',
    'ada': '2010',
    'sol': '5426',
    'dot': '6636',
    'doge': '74',
    'shib': '5994',
    'matic': '3890',
    'ltc': '2',
    'atom': '3794',
    'link': '1975',
    'xlm': '512',
    'uni': '7083',
    'avax': '5805',
    'algo': '4030',
    'etc': '1321',
    'xmr': '328',
    'fil': '2280'
  };
  
  return cmcIds[coinId] || '';
}

// Helper function to get consistent crypto slugs
function getCryptoSlug(coinId) {
  const slugs = {
    'usdt': 'tether',
    'usdc': 'usd-coin',
    'bnb': 'binancecoin',
    'xrp': 'xrp',
    'ada': 'cardano',
    'sol': 'solana',
    'dot': 'polkadot',
    'doge': 'dogecoin',
    'shib': 'shiba-inu',
    'matic': 'polygon',
    'ltc': 'litecoin',
    'atom': 'cosmos',
    'link': 'chainlink',
    'xlm': 'stellar',
    'uni': 'uniswap',
    'avax': 'avalanche',
    'algo': 'algorand',
    'etc': 'ethereum-classic',
    'xmr': 'monero',
    'fil': 'filecoin'
  };
  
  return slugs[coinId] || coinId;
}

// Static mappings of symbols to coin data (id and name)
const staticMappings = {
  'btc': { id: 'bitcoin', name: 'Bitcoin' },
  'eth': { id: 'ethereum', name: 'Ethereum' },
  'usdt': { id: 'tether', name: 'Tether' },
  'usdc': { id: 'usd-coin', name: 'USD Coin' },
  'bnb': { id: 'binancecoin', name: 'BNB' },
  'xrp': { id: 'ripple', name: 'XRP' },
  'ada': { id: 'cardano', name: 'Cardano' },
  'sol': { id: 'solana', name: 'Solana' },
  'dot': { id: 'polkadot', name: 'Polkadot' },
  'doge': { id: 'dogecoin', name: 'Dogecoin' },
  'shib': { id: 'shiba-inu', name: 'Shiba Inu' },
  'matic': { id: 'matic-network', name: 'Polygon' },
  'ltc': { id: 'litecoin', name: 'Litecoin' },
  'atom': { id: 'cosmos', name: 'Cosmos' },
  'link': { id: 'chainlink', name: 'Chainlink' },
  'xlm': { id: 'stellar', name: 'Stellar' },
  'uni': { id: 'uniswap', name: 'Uniswap' },
  'avax': { id: 'avalanche-2', name: 'Avalanche' },
  'algo': { id: 'algorand', name: 'Algorand' },
  'etc': { id: 'ethereum-classic', name: 'Ethereum Classic' },
  'xmr': { id: 'monero', name: 'Monero' },
  'fil': { id: 'filecoin', name: 'Filecoin' }
};

// Get coin data by symbol
export function getCoinData(symbol) {
  const normalizedSymbol = symbol.toLowerCase();
  return staticMappings[normalizedSymbol] || null;
}

// Get all available assets
export function getAvailableAssets() {
  return Object.entries(staticMappings).map(([symbol, data]) => ({
    id: data.id,  // Make sure id is included
    symbol: symbol.toUpperCase(),
    name: data.name,
    image: getCryptoIconUrl(symbol)  // Add image URL
  }));
}
const PROXIED_API_URL = `${CORS_PROXY}${API_BASE_URL}`;

/**
 * Fetches the current price for a cryptocurrency
 * @param {string} id - The CoinGecko coin ID (e.g., 'bitcoin')
 * @param {string} vsCurrency - The target currency (default: 'usd')
 * @returns {Promise<number>} The current price
 */
export async function getCryptoPrice(id, vsCurrency = 'usd') {
  try {
    const response = await fetch(
      `${PUBLIC_API_URL}/simple/price?ids=${id}&vs_currencies=${vsCurrency}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch price for ${id}`);
    }
    
    const data = await response.json();
    return data[id][vsCurrency];
  } catch (error) {
    console.error('Error fetching crypto price:', error);
    throw error;
  }
}

/**
 * Fetches current prices for multiple cryptocurrencies
 * @param {Array<string>} ids - Array of CoinGecko coin IDs
 * @param {string} vsCurrency - The target currency (default: 'usd')
 * @returns {Promise<Object>} Object mapping coin IDs to their prices
 */
export async function getMultipleCryptoPrices(coinIds) {
  if (!coinIds || coinIds.length === 0) {
    console.warn('No coin IDs provided to getMultipleCryptoPrices');
    return {};
  }

  // Convert array to comma-separated string for the API
  const ids = coinIds.join(',');
  const endpoint = `${API_BASE_URL}/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=usd`;
  
  // Try direct API first (some endpoints support CORS)
  try {
    console.log('Trying direct API call to:', endpoint);
    const directResponse = await fetch(endpoint);
    
    if (directResponse.ok) {
      const data = await directResponse.json();
      console.log('Direct API call successful:', data);
      return data;
    }
    console.log('Direct API call failed, trying with CORS proxy...');
  } catch (directError) {
    console.log('Direct API call failed, trying with CORS proxy...', directError);
  }

  // Fallback to CORS proxy
  try {
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(endpoint)}`;
    console.log('Fetching prices via CORS proxy:', proxyUrl);
    
    const response = await fetch(proxyUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('CORS Proxy Error Response:', errorText);
      throw new Error(`Failed to fetch crypto prices: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('CORS Proxy Response:', data);
    
    return data;
  } catch (error) {
    console.error('Error in getMultipleCryptoPrices:', error);
    throw error;
  }
}

/**
 * Searches for a cryptocurrency by symbol or name
 * @param {string} query - The search query (symbol or name)
 * @returns {Promise<Array>} Array of matching cryptocurrencies
 */
export async function searchCrypto(query) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/search?query=${encodeURIComponent(query)}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to search cryptocurrencies');
    }
    
    const data = await response.json();
    return data.coins || [];
  } catch (error) {
    console.error('Error searching cryptocurrencies:', error);
    throw error;
  }
}

// Common mapping of symbols to CoinGecko IDs
const SYMBOL_TO_ID = {
  btc: 'bitcoin',
  eth: 'ethereum',
  usdt: 'tether',
  bnb: 'binancecoin',
  sol: 'solana',
  xrp: 'ripple',
  usdc: 'usd-coin',
  ada: 'cardano',
  doge: 'dogecoin',
  dot: 'polkadot',
  // Add more as needed
};

/**
 * Gets the CoinGecko ID for a cryptocurrency by symbol
 * @param {string} symbol - The cryptocurrency symbol (e.g., 'btc')
 * @returns {Promise<string>} The CoinGecko ID (returns symbol if not found)
 */
export async function getCryptoIdBySymbol(symbol) {
  const lowerSymbol = symbol.toLowerCase();
  
  // First check our static mapping
  if (SYMBOL_TO_ID[lowerSymbol]) {
    return SYMBOL_TO_ID[lowerSymbol];
  }
  
  // Fallback to API lookup if not in our static mapping
  try {
    const response = await fetch(`${API_BASE_URL}/coins/list`);
    const coins = await response.json();
    
    // Try exact match first
    const coin = coins.find(c => c.symbol === lowerSymbol);
    if (coin) return coin.id;
    
    // If no exact match, return the symbol as a fallback
    return lowerSymbol;
  } catch (error) {
    console.error('Error getting crypto ID by symbol:', error);
    return lowerSymbol; // Return the symbol as fallback
  }
}

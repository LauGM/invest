// Service to interact with the CoinGecko API
// Using a CORS proxy as fallback for non-CORS endpoints

// Base URL for the CoinGecko API
const API_BASE_URL = 'https://api.coingecko.com/api/v3';

// Public endpoint that supports CORS
const PUBLIC_API_URL = 'https://api.coingecko.com/api/v3';

// Simple CORS proxy as fallback (not all endpoints support CORS)
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// Coin ID to image path mapping for popular coins
const coinImageMap = {
  // Mainnet coins
  'bitcoin': '1/large/bitcoin.png',
  'btc': '1/large/bitcoin.png',
  'ethereum': '279/large/ethereum.png',
  'eth': '279/large/ethereum.png',
  'tether': '325/large/Tether.png',
  'usdt': '325/large/Tether.png',
  'binancecoin': '825/large/bnb-icon2_2x.png',
  'bnb': '825/large/bnb-icon2_2x.png',
  'solana': '4128/large/solana.png',
  'sol': '4128/large/solana.png',
  'cardano': '975/large/cardano.png',
  'ada': '975/large/cardano.png',
  'ripple': '44/svg/xrp-symbol-white-128.png',
  'xrp': '44/svg/xrp-symbol-white-128.png',
  'polkadot': '12171/large/polkadot.png',
  'dot': '12171/large/polkadot.png',
  'dogecoin': '5/large/dogecoin.png',
  'doge': '5/large/dogecoin.png',
  'shiba-inu': '11939/large/shiba.png',
  'shib': '11939/large/shiba.png',
  'avalanche-2': '12559/large/Avalanche_Circle_RedWhite_Trans.png',
  'avax': '12559/large/Avalanche_Circle_RedWhite_Trans.png',
  'chainlink': '877/large/chainlink-new-logo.png',
  'link': '877/large/chainlink-new-logo.png',
  'polygon-pos': '4713/large/matic-token-icon.png',
  'matic': '4713/large/matic-token-icon.png',
  'litecoin': '2/large/litecoin.png',
  'ltc': '2/large/litecoin.png'
};

// Get cryptocurrency icon URL
export function getCryptoIconUrl(coinId, size = 'small') {
  if (!coinId) {
    console.warn('No coinId provided to getCryptoIconUrl');
    return '';
  }
  const id = coinId.toLowerCase().trim();

  // Map of common coin IDs to their CoinGecko image paths
  const coinIcons = {
    'btc': '1/thumb/bitcoin.png',
    'bitcoin': '1/thumb/bitcoin.png',
    'eth': '279/thumb/ethereum.png',
    'ethereum': '279/thumb/ethereum.png',
    'usdt': '325/thumb/Tether.png',
    'tether': '325/thumb/Tether.png',
    'bnb': '825/thumb/bnb-icon2_2x.png',
    'binancecoin': '825/thumb/bnb-icon2_2x.png',
    'sol': '4128/thumb/solana.png',
    'solana': '4128/thumb/solana.png',
    'usdc': '6319/thumb/USD_Coin_icon.png',
    'usd-coin': '6319/thumb/USD_Coin_icon.png',
    'xrp': '44/thumb/xrp-symbol-white-128.png',
    'ripple': '44/thumb/xrp-symbol-white-128.png',
    'ada': '975/thumb/cardano.png',
    'cardano': '975/thumb/cardano.png',
    'doge': '5/thumb/dogecoin.png',
    'dogecoin': '5/thumb/dogecoin.png',
    'dot': '12171/thumb/polkadot.png',
    'polkadot': '12171/thumb/polkadot.png',
    'shib': '11939/thumb/shiba.png',
    'shiba-inu': '11939/thumb/shiba.png',
    'avax': '12559/thumb/Avalanche_Circle_RedWhite_Trans.png',
    'avalanche-2': '12559/thumb/Avalanche_Circle_RedWhite_Trans.png',
    'link': '877/thumb/chainlink-new-logo.png',
    'chainlink': '877/thumb/chainlink-new-logo.png',
    'matic': '4713/thumb/matic-token-icon.png',
    'polygon-pos': '4713/thumb/matic-token-icon.png',
    'ltc': '2/thumb/litecoin.png',
    'litecoin': '2/thumb/litecoin.png'
  };

  // Try to find a matching icon
  let iconPath = coinIcons[id];

  // If no direct match, try to find a partial match
  if (!iconPath) {
    const matchingKey = Object.keys(coinIcons).find(key =>
      id.includes(key) || key.includes(id)
    );
    if (matchingKey) {
      iconPath = coinIcons[matchingKey];
    }
  }

  // If we found a matching icon, return the full URL
  if (iconPath) {
    return `https://assets.coingecko.com/coins/images/${iconPath}`;
  }

  // If we have a CoinGecko ID but no icon, try to get the image from the API
  const coinData = getCoinData(id);
  if (coinData?.image) {
    return coinData.image.replace('/large/', '/thumb/');
  }

  // As a last resort, return a generic icon based on the coin ID
  if (id.includes('usd') || id.includes('usdt') || id.includes('usdc') || id.includes('dai')) {
    return 'https://assets.coingecko.com/coins/images/325/thumb/Tether.png';
  }
  if (id.includes('btc') || id.includes('bitcoin')) {
    return 'https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png';
  }
  if (id.includes('eth') || id.includes('ethereum')) {
    return 'https://assets.coingecko.com/coins/images/279/thumb/ethereum.png';
  }

  // Default fallback to Ethereum icon
  return 'https://assets.coingecko.com/coins/images/279/thumb/ethereum.png';
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

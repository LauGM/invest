<template>
  <div class="dashboard">
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3" v-for="(stat, i) in stats" :key="i">
        <v-card class="stat-card" :color="stat.color" dark>
          <v-card-text class="d-flex align-center">
            <v-icon size="48" class="me-4">{{ stat.icon }}</v-icon>
            <div>
              <div class="text-h6">{{ stat.title }}</div>
              <div class="text-h4 font-weight-bold">{{ stat.value }}</div>
              <div class="text-caption" v-if="stat.change !== undefined">
                <v-icon :color="stat.change >= 0 ? 'success' : 'error'" size="small">
                  {{ stat.change >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
                </v-icon>
                {{ formatCurrency(Math.abs(stat.change)) }} ({{ Math.abs(stat.percentageChange) }}%) {{ stat.change >= 0 ? 'up' : 'down' }} from last month
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" lg="8">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="me-2">mdi-history</v-icon>
            Recent Transactions
            <v-progress-circular
              v-if="transactionsLoading"
              indeterminate
              size="24"
              width="2"
              class="ms-2"
            ></v-progress-circular>
          </v-card-title>
          <v-card-text>
            <v-table v-if="recentTransactions.length > 0">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Asset</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="tx in recentTransactions" :key="tx.id">
                  <td>{{ formatDate(tx.createdAt) }}</td>
                  <td class="d-flex align-center">
                    <v-img 
                      :src="getCryptoIconUrl(tx.assetSymbol || tx.asset, 'small')" 
                      :alt="tx.assetName || tx.asset"
                      @error="handleImageError($event, tx.assetSymbol || tx.asset)"
                      :lazy-src="getFallbackIcon(tx.assetSymbol || tx.asset)"
                      :key="'tx-img-' + tx.id + '-' + Date.now()"
                      width="24"
                      height="24"
                      class="me-2"
                      contain
                    >
                      <template v-slot:placeholder>
                        <v-icon size="16" color="primary">mdi-currency-usd</v-icon>
                      </template>
                      <template v-slot:error>
                        <v-icon size="16" color="primary">mdi-currency-usd</v-icon>
                      </template>
                    </v-img>
                    {{ tx.assetName || tx.asset }}
                  </td>
                  <td>{{ tx.type || 'Buy' }}</td>
                  <td>{{ formatCurrency(tx.amount * (tx.price || 1)) }}</td>
                  <td>
                    <v-chip 
                      size="small" 
                      :color="getStatusColor(tx.status)" 
                      variant="flat"
                      label
                    >
                      {{ tx.status || 'Completed' }}
                    </v-chip>
                  </td>
                </tr>
              </tbody>
            </v-table>
            <v-alert
              v-else
              type="info"
              variant="tonal"
              class="mt-2"
            >
              No recent transactions found
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" lg="4">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="me-2">mdi-star</v-icon>
            Watchlist
            <v-progress-circular
              v-if="watchlistLoading"
              indeterminate
              size="24"
              width="2"
              class="ms-2"
            ></v-progress-circular>
          </v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item v-for="(coin, index) in watchlist" :key="index" class="px-0" :class="{'mb-2': index < watchlist.length - 1}">
                <template v-slot:prepend>
                  <v-avatar class="mr-2" size="24" style="min-width: 24px; width: 24px;">
                    <v-img 
                      :src="getCryptoIconUrl(coin.id, 'small')" 
                      :alt="coin.name"
                      @error="handleImageError($event, coin.id)"
                      :lazy-src="getFallbackIcon(coin.id)"
                      :key="'watchlist-' + coin.id + '-' + Date.now()"
                      width="24"
                      height="24"
                      contain
                    >
                      <template v-slot:placeholder>
                        <v-icon size="16" color="primary">mdi-currency-usd</v-icon>
                      </template>
                      <template v-slot:error>
                        <v-icon size="16" color="primary">mdi-currency-usd</v-icon>
                      </template>
                    </v-img>
                  </v-avatar>
                </template>
                <v-list-item-title>{{ coin.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ coin.symbol }}</v-list-item-subtitle>
                <template v-slot:append>
                  <div class="text-right">
                    <div class="font-weight-bold">${{ coin.price.toLocaleString() }}</div>
                    <div :class="coin.change >= 0 ? 'text-success' : 'text-error'">
                      {{ coin.change >= 0 ? '+' : '' }}{{ coin.change }}%
                    </div>
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated, onUnmounted } from 'vue';
import { useInvestmentStore } from '@/stores/investmentStore';
import { getMultipleCryptoPrices, getCryptoIconUrl } from '@/services/cryptoApi';
import { format } from 'date-fns';

const investmentStore = useInvestmentStore();

// Computed properties for dashboard stats
const stats = computed(() => {
  const portfolioValue = investmentStore.totalTrackedValue;
  const totalInvested = investmentStore.totalInvested;
  const profitLoss = portfolioValue - totalInvested;
  const profitLossPercentage = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;
  
  // Static daily change since we removed the portfolio history
  const dailyChange = 0;
  
  return [
    {
      title: 'Total Portfolio Value',
      value: formatCurrency(portfolioValue),
      icon: 'mdi-wallet',
      color: 'primary',
      change: dailyChange,
      percentageChange: dailyChange / (portfolioValue - dailyChange) * 100
    },
    {
      title: '24h Change',
      value: `${dailyChange >= 0 ? '+' : ''}${formatCurrency(dailyChange)}`,
      icon: 'mdi-trending-up',
      color: dailyChange >= 0 ? 'success' : 'error',
      change: dailyChange,
      percentageChange: dailyChange / (portfolioValue - dailyChange) * 100
    },
    {
      title: 'Total Profit/Loss',
      value: `${profitLoss >= 0 ? '+' : ''}${formatCurrency(profitLoss)}`,
      icon: 'mdi-chart-line',
      color: profitLoss >= 0 ? 'success' : 'error',
      change: profitLoss,
      percentageChange: profitLossPercentage
    },
    {
      title: 'Active Investments',
      value: investmentStore.investments.length,
      icon: 'mdi-currency-btc',
      color: 'deep-purple',
    }
  ];
});

// Default watchlist with top 5 cryptocurrencies by market cap
const defaultWatchlist = [
  { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'eth', name: 'Ethereum' },
  { id: 'tether', symbol: 'usdt', name: 'Tether' },
  { id: 'binancecoin', symbol: 'bnb', name: 'BNB' },
  { id: 'solana', symbol: 'sol', name: 'Solana' }
];

const watchlist = ref([]);
const watchlistLoading = ref(true);

// Fetch watchlist data
const fetchWatchlistData = async () => {
  try {
    watchlistLoading.value = true;
    
    // Get prices for all coins in the watchlist
    const coinIds = defaultWatchlist.map(coin => coin.id);
    const prices = await getMultipleCryptoPrices(coinIds);
    
    // Get 24h price change data
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIds.join(',')}&price_change_percentage=24h`
    );
    const marketData = await response.json();
    
    // Map the data to our watchlist format
    watchlist.value = defaultWatchlist.map(coin => {
      const priceData = prices[coin.id] || { usd: 0 };
      const marketInfo = marketData.find(m => m.id === coin.id) || { price_change_percentage_24h: 0 };
      
      return {
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        price: priceData.usd || 0,
        change: marketInfo.price_change_percentage_24h ? 
          parseFloat(marketInfo.price_change_percentage_24h.toFixed(2)) : 0,
        image: getCryptoIconUrl(coin.id, 'small')
      };
    });
  } catch (error) {
    console.error('Error fetching watchlist data:', error);
    // Fallback to default values if API fails
    watchlist.value = defaultWatchlist.map(coin => ({
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      price: 0,
      change: 0,
      image: getCryptoIconUrl(coin.id, 'medium')
    }));
  } finally {
    watchlistLoading.value = false;
  }
};

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Computed property to get recent transactions
const recentTransactions = computed(() => {
  // Get all investments, sorted by date (newest first)
  return [...investmentStore.investments]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5); // Limit to 5 most recent
});

const transactionsLoading = computed(() => investmentStore.isLoading);

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch (e) {
    console.error('Error formatting date:', e);
    return dateString;
  }
};

// Get fallback icon URL
const getFallbackIcon = (coinId) => {
  // Try to get the icon URL using the same logic as getCryptoIconUrl
  const url = getCryptoIconUrl(coinId, 'thumb');
  
  // If we got a URL, use it
  if (url) {
    return url;
  }
  
  // Default fallback to Ethereum icon
  return 'https://assets.coingecko.com/coins/images/279/thumb/ethereum.png';
};

// Get status color for chips
const getStatusColor = (status) => {
  const statusMap = {
    'completed': 'success',
    'pending': 'warning',
    'failed': 'error',
    'cancelled': 'error',
    'processing': 'info'
  };
  return statusMap[status?.toLowerCase()] || 'default';
};


// Handle image loading errors
const handleImageError = (event, coinId) => {
  console.warn(`Failed to load image for ${coinId}`, event);
  // Force update the image source to trigger a re-render
  if (event.target) {
    event.target.src = getFallbackIcon(coinId);
  }
};

// Track if the component is still mounted
let isMounted = true;

// Initialize dashboard data
const initializeDashboard = async () => {
  try {
    console.log('Initializing dashboard...');
    console.log('Dashboard initialized');
  } catch (error) {
    console.error('Error initializing dashboard:', error);
  }
};

// Set up auto-refresh every 5 minutes
let refreshInterval;

// Initialize on mount
onMounted(async () => {
  console.log('Dashboard mounted, initializing...');
  
  try {
    // Update prices first
    console.log('Updating investment prices...');
    await investmentStore.updatePrices();
    
    // Then fetch all dashboard data in parallel
    await Promise.all([
      initializeDashboard(),
      fetchWatchlistData()
    ]);
    
    // Set up auto-refresh
    refreshInterval = setInterval(() => {
      fetchWatchlistData();
    }, 5 * 60 * 1000);
    
    console.log('Dashboard initialization complete');
  } catch (error) {
    console.error('Error initializing dashboard:', error);
  }
});

// Re-initialize when the route changes to this component
onActivated(initializeDashboard);

// Cleanup on unmount
onUnmounted(() => {
  if (!isMounted) return;
  
  console.log('Dashboard unmounting, cleaning up...');
  isMounted = false;
  
  // Clear any intervals
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
  
  console.log('Dashboard cleanup complete');
});


</script>

<style scoped>
.stat-card {
  height: 100%;
  transition: transform 0.3s ease;
  border-radius: 12px;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

:deep(.v-card-text) {
  padding: 20px;
}

:deep(.v-card-title) {
  padding: 16px 20px;
  font-weight: 600;
}

.v-table {
  background-color: transparent;
}
</style>

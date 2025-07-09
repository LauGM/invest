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
        <v-card class="mb-6">
          <v-card-title class="d-flex justify-space-between align-center">
            <span>Portfolio Performance</span>
            <v-btn-toggle
              v-model="timeRange"
              mandatory
              density="compact"
              color="primary"
              @update:modelValue="fetchPortfolioHistory"
            >
              <v-btn value="7d">7D</v-btn>
              <v-btn value="1m">1M</v-btn>
              <v-btn value="3m">3M</v-btn>
              <v-btn value="1y">1Y</v-btn>
            </v-btn-toggle>
          </v-card-title>
          <v-card-text>
            <div style="height: 300px; position: relative;">
              <PortfolioChart
                v-if="chartData"
                :data="chartData"
                height="100%"
              />
              <v-progress-circular
                v-else
                indeterminate
                color="primary"
                size="64"
                class="ma-auto d-flex align-center justify-center"
                style="width: 100%;"
              ></v-progress-circular>
            </div>
          </v-card-text>
        </v-card>

        <v-card>
          <v-card-title>Recent Transactions</v-card-title>
          <v-card-text>
            <v-table>
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
                <tr v-for="i in 5" :key="i">
                  <td>2023-06-{{ 10 + i }}</td>
                  <td>Bitcoin</td>
                  <td>Buy</td>
                  <td>${{ (1000 * i).toLocaleString() }}</td>
                  <td>
                    <v-chip size="small" color="success" variant="flat">Completed</v-chip>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" lg="4">
        <v-card class="mb-6">
          <v-card-title>Asset Allocation</v-card-title>
          <v-card-text>
            <div style="height: 300px;" class="d-flex align-center justify-center">
              <p class="text-grey">Pie chart will be displayed here</p>
            </div>
          </v-card-text>
        </v-card>

        <v-card>
          <v-card-title>Watchlist</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item v-for="(coin, i) in watchlist" :key="i" :title="coin.name" :subtitle="coin.symbol">
                <template v-slot:prepend>
                  <v-avatar size="40" class="me-3">
                    <v-img :src="coin.image" :alt="coin.name" />
                  </v-avatar>
                </template>
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
import { ref, computed, onMounted, watch } from 'vue';
import { useInvestmentStore } from '@/stores/investmentStore';
import PortfolioChart from '@/components/charts/PortfolioChart.vue';

const investmentStore = useInvestmentStore();
const loading = ref(true);
const timeRange = ref('1m');
const chartData = ref(null);

// Computed properties for dashboard stats
const stats = computed(() => {
  const portfolioValue = investmentStore.totalTrackedValue;
  const totalInvested = investmentStore.totalInvested;
  const profitLoss = portfolioValue - totalInvested;
  const profitLossPercentage = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;
  
  // Get 24h change from portfolio history if available
  let dailyChange = 0;
  if (chartData.value?.values?.length > 1) {
    const today = chartData.value.values[chartData.value.values.length - 1];
    const yesterday = chartData.value.values[chartData.value.values.length - 2];
    dailyChange = today - yesterday;
  }
  
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

const watchlist = ref([
  {
    name: 'Bitcoin',
    symbol: 'BTC',
    price: 42563.42,
    change: 2.5,
    image: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png'
  },
  {
    name: 'Ethereum',
    symbol: 'ETH',
    price: 2324.67,
    change: -1.2,
    image: 'https://cryptologos.cc/logos/ethereum-eth-logo.png'
  },
  {
    name: 'Cardano',
    symbol: 'ADA',
    price: 0.45,
    change: 0.8,
    image: 'https://cryptologos.cc/logos/cardano-ada-logo.png'
  },
  {
    name: 'Solana',
    symbol: 'SOL',
    price: 102.34,
    change: 5.7,
    image: 'https://cryptologos.cc/logos/solana-sol-logo.png'
  },
  {
    name: 'Polkadot',
    symbol: 'DOT',
    price: 6.78,
    change: -0.5,
    image: 'https://cryptologos.cc/logos/polkadot-new-dot-logo.png'
  }
]);

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Fetch portfolio history data
const fetchPortfolioHistory = async () => {
  try {
    loading.value = true;
    // In a real app, this would fetch from your backend
    const days = timeRange.value === '7d' ? 7 : 
                 timeRange.value === '1m' ? 30 : 
                 timeRange.value === '3m' ? 90 : 365;
    
    // Simulate API call with timeout
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate sample data for the chart
    const now = new Date();
    const values = [];
    const dates = [];
    const baseValue = investmentStore.totalPortfolioValue || 10000;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
      
      // Simulate price movement with some randomness
      const previousValue = values[i+1] || baseValue;
      const change = (Math.random() - 0.5) * 0.02; // Random change between -1% and +1%
      values.push(previousValue * (1 + change));
    }
    
    // Format data for the chart
    chartData.value = {
      dates: dates,
      values: values
    };
    
  } catch (error) {
    console.error('Error fetching portfolio history:', error);
  } finally {
    loading.value = false;
  }
};

// Initialize component
onMounted(() => {
  fetchPortfolioHistory();
});

// Watch for time range changes
watch(timeRange, () => {
  fetchPortfolioHistory();
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

:deep(.v-btn-toggle) {
  background: transparent;
  border: 1px solid rgba(var(--v-theme-primary), 0.3);
  border-radius: 8px;
  padding: 2px;
}

:deep(.v-btn-toggle .v-btn) {
  min-width: 48px;
  height: 28px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.v-table {
  background-color: transparent;
}
</style>

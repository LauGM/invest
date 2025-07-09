<template>
  <div class="analytics">
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card>
          <v-card-title>Portfolio Performance</v-card-title>
          <v-card-text>
            <div class="d-flex justify-space-between align-center mb-4">
              <div>
                <div class="text-h4 font-weight-bold">${{ formatNumber(portfolioValue) }}</div>
                <div class="text-caption text-grey">Total Portfolio Value</div>
              </div>
              <v-btn-toggle
                v-model="timeRange"
                color="primary"
                mandatory
                density="compact"
              >
                <v-btn value="1w">1W</v-btn>
                <v-btn value="1m">1M</v-btn>
                <v-btn value="6m">6M</v-btn>
                <v-btn value="1y">1Y</v-btn>
                <v-btn value="all">ALL</v-btn>
              </v-btn-toggle>
            </div>
            
            <div style="height: 300px;" class="d-flex align-center justify-center">
              <p class="text-grey">Performance chart will be displayed here</p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="8">
        <v-card class="mb-6">
          <v-card-title>Asset Allocation</v-card-title>
          <v-card-text>
            <div class="d-flex" style="height: 300px;">
              <div style="width: 50%;" class="d-flex align-center justify-center">
                <div style="width: 250px; height: 250px;">
                  <!-- Donut chart placeholder -->
                  <div class="d-flex align-center justify-center" style="width: 100%; height: 100%; border-radius: 50%; background: conic-gradient(
                    #4CAF50 0% 40%,
                    #2196F3 40% 70%,
                    #9C27B0 70% 85%,
                    #FF9800 85% 95%,
                    #F44336 95% 100%
                  );">
                    <div class="text-center">
                      <div class="text-h5">{{ investments.length }}</div>
                      <div class="text-caption">Assets</div>
                    </div>
                  </div>
                </div>
              </div>
              <div style="width: 50%;" class="d-flex align-center">
                <v-list density="compact" class="w-100">
                  <v-list-item
                    v-for="(asset, i) in assetAllocation"
                    :key="i"
                    :title="asset.name"
                    :subtitle="asset.percentage + '%'"
                  >
                    <template v-slot:prepend>
                      <v-avatar :color="asset.color" size="12" class="me-3"></v-avatar>
                    </template>
                    <template v-slot:append>
                      <span class="font-weight-medium">${{ formatNumber(asset.value) }}</span>
                    </template>
                  </v-list-item>
                </v-list>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="mb-6">
          <v-card-title>Performance by Asset</v-card-title>
          <v-card-text>
            <v-list lines="two" class="pa-0">
              <v-list-item
                v-for="(asset, i) in performanceByAsset"
                :key="i"
                :title="asset.name"
                :subtitle="'$' + formatNumber(asset.value) + ' (' + (asset.change >= 0 ? '+' : '') + asset.change + '%)'"
                class="px-0"
              >
                <template v-slot:prepend>
                  <v-avatar size="40" class="me-3">
                    <v-img :src="asset.image" :alt="asset.name" />
                  </v-avatar>
                </template>
                <template v-slot:append>
                  <v-chip
                    :color="asset.change >= 0 ? 'success' : 'error'"
                    variant="tonal"
                    size="small"
                  >
                    {{ asset.change >= 0 ? '▲' : '▼' }} {{ Math.abs(asset.change) }}%
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>Transaction History</v-card-title>
          <v-card-text>
            <v-data-table
              :headers="transactionHeaders"
              :items="transactions"
              :items-per-page="5"
              class="elevation-0"
            >
              <template v-slot:item.asset="{ item }">
                <div class="d-flex align-center">
                  <v-avatar size="32" class="me-3">
                    <v-img :src="getAssetImage(item.asset)" :alt="item.asset" />
                  </v-avatar>
                  <div>
                    <div class="font-weight-medium">{{ getAssetName(item.asset) }}</div>
                    <div class="text-caption text-grey">{{ item.asset.toUpperCase() }}</div>
                  </div>
                </div>
              </template>

              <template v-slot:item.type="{ item }">
                <v-chip
                  :color="item.type === 'buy' ? 'success' : 'error'"
                  variant="tonal"
                  size="small"
                >
                  {{ item.type === 'buy' ? 'Buy' : 'Sell' }}
                </v-chip>
              </template>

              <template v-slot:item.amount="{ item }">
                {{ formatNumber(item.amount) }} {{ item.asset.toUpperCase() }}
              </template>

              <template v-slot:item.price="{ item }">
                ${{ formatNumber(item.price) }}
              </template>

              <template v-slot:item.total="{ item }">
                ${{ formatNumber(item.amount * item.price) }}
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const timeRange = ref('1m');

const portfolioValue = 15432.89;

const investments = [
  { id: 'bitcoin', name: 'Bitcoin', amount: 0.25, value: 10640.86, change: 12.5 },
  { id: 'ethereum', name: 'Ethereum', amount: 2.5, value: 5811.68, change: 29.15 },
  { id: 'cardano', name: 'Cardano', amount: 1000, value: 450, change: 12.5 },
  { id: 'solana', name: 'Solana', amount: 10, value: 1023.40, change: -5.2 },
  { id: 'polkadot', name: 'Polkadot', amount: 50, value: 339, change: 8.7 },
];

const assetAllocation = [
  { name: 'Bitcoin', value: 10640.86, percentage: 69, color: '#4CAF50' },
  { name: 'Ethereum', value: 5811.68, percentage: 37, color: '#2196F3' },
  { name: 'Cardano', value: 450, percentage: 3, color: '#9C27B0' },
  { name: 'Solana', value: 1023.40, percentage: 7, color: '#FF9800' },
  { name: 'Polkadot', value: 339, percentage: 2, color: '#F44336' },
];

const performanceByAsset = computed(() => {
  return investments.map(asset => ({
    ...asset,
    image: getAssetImage(asset.id),
  }));
});

const transactionHeaders = [
  { title: 'Date', key: 'date', sortable: true },
  { title: 'Asset', key: 'asset', sortable: true },
  { title: 'Type', key: 'type', sortable: true },
  { title: 'Amount', key: 'amount', align: 'end', sortable: true },
  { title: 'Price', key: 'price', align: 'end', sortable: true },
  { title: 'Total', key: 'total', align: 'end', sortable: true },
];

const transactions = [
  { id: 1, date: '2023-07-10', asset: 'bitcoin', type: 'buy', amount: 0.1, price: 42563.42 },
  { id: 2, date: '2023-07-09', asset: 'ethereum', type: 'buy', amount: 0.5, price: 2324.67 },
  { id: 3, date: '2023-07-08', asset: 'cardano', type: 'buy', amount: 500, price: 0.45 },
  { id: 4, date: '2023-07-07', asset: 'solana', type: 'sell', amount: 2, price: 102.34 },
  { id: 5, date: '2023-07-06', asset: 'polkadot', type: 'buy', amount: 20, price: 6.78 },
];

function getAssetImage(assetId) {
  const assetImages = {
    bitcoin: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
    ethereum: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    cardano: 'https://cryptologos.cc/logos/cardano-ada-logo.png',
    solana: 'https://cryptologos.cc/logos/solana-sol-logo.png',
    polkadot: 'https://cryptologos.cc/logos/polkadot-new-dot-logo.png',
  };
  return assetImages[assetId] || 'https://via.placeholder.com/32';
}

function getAssetName(assetId) {
  const assetNames = {
    bitcoin: 'Bitcoin',
    ethereum: 'Ethereum',
    cardano: 'Cardano',
    solana: 'Solana',
    polkadot: 'Polkadot',
  };
  return assetNames[assetId] || assetId.charAt(0).toUpperCase() + assetId.slice(1);
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  }).format(value);
}
</script>

<style scoped>
.v-card {
  border-radius: 12px;
}

.v-list-item {
  padding-left: 0;
  padding-right: 0;
}

.v-list-item--density-compact:not(.v-list-item--nav).v-list-item--one-line {
  min-height: 40px;
}
</style>

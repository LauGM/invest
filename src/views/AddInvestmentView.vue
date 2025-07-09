<template>
  <div class="add-investment">
    <v-card max-width="800" class="mx-auto">
      <v-card-title class="text-h5 font-weight-bold mb-4">
        <v-icon icon="mdi-plus-circle" class="me-2"></v-icon>
        Add New Investment
      </v-card-title>

      <v-card-text>
        <v-form v-model="valid" @submit.prevent="saveInvestment">
          <v-row>
            <v-col cols="12" md="6">
              <v-select
                v-model="form.asset"
                :items="availableAssets"
                item-title="name"
                item-value="symbol"
                label="Cryptocurrency"
                variant="outlined"
                :rules="[v => !!v || 'Cryptocurrency is required']"
                return-object
                class="mb-4"
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props" :title="item.raw.name" :subtitle="item.raw.symbol">
                    <template v-slot:prepend>
                      <v-avatar size="32" class="me-3">
                        <v-img 
                          :src="getAssetIcon(item.raw.id)" 
                          :alt="item.raw.name"
                          @error="handleImageError($event, item.raw)"
                        >
                          <template v-slot:placeholder>
                            <v-icon size="20" color="grey">mdi-currency-usd</v-icon>
                          </template>
                        </v-img>
                      </v-avatar>
                    </template>
                  </v-list-item>
                </template>
                <template v-slot:selection="{ item }">
                  <div class="d-flex align-center">
                    <v-avatar size="24" class="me-2">
                      <v-img 
                        :src="getAssetIcon(item.raw.id)" 
                        :alt="item.raw.name"
                        @error="handleImageError($event, item.raw)"
                      >
                        <template v-slot:placeholder>
                          <v-icon size="16" color="grey">mdi-currency-usd</v-icon>
                        </template>
                      </v-img>
                    </v-avatar>
                    <span>{{ item.raw.name }} ({{ item.raw.symbol }})</span>
                  </div>
                </template>
              </v-select>

              <v-text-field
                v-model.number="form.amount"
                label="Amount"
                type="number"
                min="0"
                step="0.00000001"
                variant="outlined"
                :rules="[v => v > 0 || 'Amount must be greater than 0']"
                class="mb-4"
              ></v-text-field>

              <v-switch
                v-model="unknownPrice"
                label="I don't know the purchase price"
                color="primary"
                hide-details
                class="mb-2"
                @update:model-value="onUnknownPriceToggle"
              ></v-switch>

              <v-text-field
                v-model.number="form.buyPrice"
                label="Buy Price (USD)"
                type="number"
                min="0"
                step="0.01"
                prefix="$"
                variant="outlined"
                :rules="!unknownPrice ? [v => v > 0 || 'Price must be greater than 0'] : []"
                :disabled="unknownPrice"
                class="mb-4"
              ></v-text-field>

              <v-text-field
                v-model="form.date"
                label="Date of Purchase"
                type="date"
                variant="outlined"
                :rules="[v => !!v || 'Date is required']"
                class="mb-4"
              ></v-text-field>

              <v-textarea
                v-model="form.notes"
                label="Notes (Optional)"
                variant="outlined"
                rows="3"
                class="mb-4"
              ></v-textarea>
            </v-col>

            <v-col cols="12" md="6">
              <v-card variant="outlined" class="pa-4 mb-4">
                <div class="text-subtitle-1 font-weight-bold mb-2">Investment Summary</div>
                <v-divider class="mb-3"></v-divider>
                
                <div v-if="form.asset" class="d-flex align-center mb-4">
                  <v-avatar size="48" class="me-3">
                    <v-img :src="form.asset.image" :alt="form.asset.name" />
                  </v-avatar>
                  <div>
                    <div class="text-h6">{{ form.asset.name }}</div>
                    <div class="text-caption text-grey">{{ form.asset.symbol.toUpperCase() }}</div>
                  </div>
                </div>

                <v-list density="compact" class="bg-transparent">
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon icon="mdi-currency-usd" class="me-2"></v-icon>
                    </template>
                    <v-list-item-title>Invested Amount</v-list-item-title>
                    <template v-slot:append>
                      <span class="font-weight-medium">
                        {{ calculateInvestedAmount === 'N/A' ? 'N/A' : `$${calculateInvestedAmount}` }}
                        <v-tooltip v-if="form.hasUnknownCost" text="Purchase price unknown" location="top">
                          <template v-slot:activator="{ props }">
                            <v-icon v-bind="props" icon="mdi-information" size="small" class="ml-1"></v-icon>
                          </template>
                        </v-tooltip>
                      </span>
                    </template>
                  </v-list-item>
                  
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon icon="mdi-cash" class="me-2"></v-icon>
                    </template>
                    <v-list-item-title>Current Value</v-list-item-title>
                    <template v-slot:append>
                      <span class="font-weight-medium">
                        ${{ calculateCurrentValue }}
                      </span>
                    </template>
                  </v-list-item>
                  
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon icon="mdi-chart-line" class="me-2"></v-icon>
                    </template>
                    <v-list-item-title>Profit/Loss</v-list-item-title>
                    <template v-slot:append>
                      <template v-if="calculateProfitLoss === 'N/A'">
                        <span class="text-grey">N/A</span>
                        <v-tooltip text="Cannot calculate profit/loss without purchase price" location="top">
                          <template v-slot:activator="{ props: tooltipProps }">
                            <v-icon v-bind="tooltipProps" icon="mdi-information" size="small" class="ml-1"></v-icon>
                          </template>
                        </v-tooltip>
                      </template>
                      <span v-else :class="['font-weight-medium', profitLossColor]">
                        {{ calculateProfitLoss >= 0 ? '+' : '' }}{{ calculateProfitLoss }}%
                      </span>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card>

              <div class="d-flex justify-space-between mt-6">
                <v-btn
                  color="secondary"
                  variant="tonal"
                  @click="$router.go(-1)"
                >
                  Cancel
                </v-btn>
                
                <v-btn
                  color="primary"
                  type="submit"
                  :disabled="!valid || loading"
                  :loading="loading"
                >
                  <v-icon start>mdi-content-save</v-icon>
                  Save Investment
                </v-btn>
              </div>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getAvailableAssets, getCryptoIconUrl } from '@/services/cryptoApi';
import { getCryptoPrice } from '@/services/cryptoApi';

const router = useRouter();
const valid = ref(false);
const loading = ref(false);

const availableAssets = ref([]);

// Get available assets with icons
onMounted(() => {
  availableAssets.value = getAvailableAssets();
});

// Handle image loading errors
const handleImageError = (event, item) => {
  const itemName = item?.name || item?.raw?.name || 'unknown';
  console.warn(`Failed to load icon for ${itemName}`);
  
  // Safely set src to empty if event and target exist
  if (event?.target) {
    event.target.src = '';
  }
};

// Helper to get asset icon URL with fallback
const getAssetIcon = (coinId) => {
  if (!coinId) return '';
  return getCryptoIconUrl(coinId);
};

const form = ref({
  asset: null,
  amount: '',
  buyPrice: '',
  date: new Date().toISOString().substr(0, 10),
  notes: '',
  hasUnknownCost: false
});

const unknownPrice = ref(false);

const onUnknownPriceToggle = (value) => {
  if (value) {
    form.value.hasUnknownCost = true;
    form.value.buyPrice = 0; // Set to 0 when price is unknown
  } else {
    form.value.hasUnknownCost = false;
    form.value.buyPrice = ''; // Reset to empty when enabling price input
  }
};

const calculateInvestedAmount = computed(() => {
  if (form.value.hasUnknownCost) return 'N/A';
  if (!form.value.amount || !form.value.buyPrice) return '0.00';
  return (form.value.amount * form.value.buyPrice).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
});

const currentPrice = ref(null);
const loadingPrice = ref(false);

// Fetch current price when asset changes
const fetchCurrentPrice = async () => {
  if (!form.value.asset?.id) {
    currentPrice.value = null;
    return;
  }
  
  try {
    loadingPrice.value = true;
    currentPrice.value = await getCryptoPrice(form.value.asset.id);
  } catch (error) {
    console.error('Error fetching current price:', error);
    currentPrice.value = null;
  } finally {
    loadingPrice.value = false;
  }
};

// Watch for asset changes
watch(() => form.value.asset, () => {
  fetchCurrentPrice();
}, { immediate: true });

const calculateCurrentValue = computed(() => {
  if (!form.value.amount) return '0.00';
  if (!currentPrice.value) return 'Loading...';
  
  const value = form.value.amount * currentPrice.value;
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
});

const calculateProfitLoss = computed(() => {
  if (form.value.hasUnknownCost) return 'N/A';
  if (!form.value.amount || !form.value.buyPrice || !currentPrice.value) return null;
  
  const buyPrice = parseFloat(form.value.buyPrice);
  const profitLossPercentage = ((currentPrice.value - buyPrice) / buyPrice) * 100;
  
  return profitLossPercentage.toFixed(2);
});

const profitLossColor = computed(() => {
  const profitLoss = parseFloat(calculateProfitLoss.value);
  if (isNaN(profitLoss)) return '';
  return profitLoss >= 0 ? 'text-success' : 'text-error';
});

// Import the investment store
import { useInvestmentStore } from '@/stores/investmentStore';

const investmentStore = useInvestmentStore();

async function saveInvestment() {
  if (!valid.value) return;
  
  loading.value = true;
  
  try {
    // Prepare the investment data
    const investmentData = {
      asset: form.value.asset.id,
      assetName: form.value.asset.name,
      assetSymbol: form.value.asset.symbol,
      amount: parseFloat(form.value.amount),
      price: form.value.hasUnknownCost ? null : parseFloat(form.value.buyPrice),
      date: form.value.date,
      notes: form.value.notes || '',
      currentPrice: form.value.asset.current_price // Assuming this is available from the asset object
    };
    
    // Add the investment to the store
    investmentStore.addInvestment(investmentData);
    
    // Show success message and redirect
    alert('Investment added successfully!');
    router.push('/investments');
  } catch (error) {
    console.error('Error saving investment:', error);
    alert('Failed to save investment. Please try again.');
  } finally {
    loading.value = false;
  }
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

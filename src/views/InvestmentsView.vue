<template>
  <div class="investments">
    <v-card class="mb-6">
      <v-card-title class="d-flex align-center">
        <span>My Investments</span>
        <v-spacer></v-spacer>
        <v-btn 
          color="primary" 
          :loading="isRefreshing" 
          :disabled="isRefreshing"
          @click="refreshPrices"
          class="mr-2"
          size="small"
          variant="tonal"
        >
          <v-icon start>mdi-refresh</v-icon>
          Refresh Prices
        </v-btn>
        <v-tooltip location="bottom">
          <template v-slot:activator="{ props: tooltipProps }">
            <v-icon 
              v-bind="tooltipProps" 
              icon="mdi-information-outline" 
              size="small" 
              class="text-grey"
            ></v-icon>
          </template>
          <span>Last updated: {{ lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Never' }}</span>
        </v-tooltip>
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search"
          append-inner-icon="mdi-magnify"
          label="Search"
          single-line
          hide-details
          density="compact"
          class="mr-4"
          style="max-width: 300px;"
        ></v-text-field>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="$router.push('/add-investment')">
          Add Investment
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-data-table
          :items-per-page="10"
          :headers="headers"
          :items="investments"
          :search="search"
          :loading="loading"
          :items-per-page-options="[5, 10, 25, 50]"
          class="elevation-1"
          loading-text="Loading investments..."
          no-data-text="No investments found. Add your first investment to get started!"
        >
          <!-- Custom cell rendering for asset column -->
          <template v-for="header in headers" :key="header.key" v-slot:[`item.${header.key}`]="{ item }">
            <template v-if="header.key === 'asset'">
              <div class="d-flex align-center">
                <v-avatar size="32" class="me-3">
                  <v-img 
                    :src="getAssetIcon(item.assetSymbol || item.asset)" 
                    :alt="item.assetName || item.asset"
                    @error="handleImageError($event, item)"
                  >
                    <template v-slot:placeholder>
                      <v-icon size="20" color="grey">mdi-currency-usd</v-icon>
                    </template>
                  </v-img>
                </v-avatar>
                <div>
                  <div class="font-weight-medium">{{ item.assetName || formatAssetName(item.asset) }}</div>
                  <div class="text-caption text-grey">{{ item.assetSymbol || item.asset.toUpperCase() }}</div>
                  <v-chip v-if="item.hasUnknownCost" size="x-small" color="warning" class="mt-1" density="compact">
                    <v-icon start size="small">mdi-help-circle</v-icon>
                    Unknown cost
                  </v-chip>
                </div>
              </div>
            </template>

            <template v-else-if="header.key === 'currentPrice'">
              {{ formatCurrency(item.currentPrice) }}
            </template>

            <template v-else-if="header.key === 'amount'">
              {{ formatAmount(item) }}
            </template>

            <template v-else-if="header.key === 'costBasis'">
              {{ formatCurrency(item.costBasis) }}
              <v-tooltip v-if="item.hasUnknownCost" text="Purchase price unknown" location="top">
                <template v-slot:activator="{ props: tooltipProps }">
                  <v-icon v-bind="tooltipProps" icon="mdi-information" size="small" class="ml-1"></v-icon>
                </template>
              </v-tooltip>
            </template>

            <template v-else-if="header.key === 'currentValue'">
              {{ formatCurrency(item.currentValue) }}
            </template>

            <template v-else-if="header.key === 'profitLoss'">
              <span :class="getProfitLossColorClass(item.profitLossPercentage)">
                {{ formatPercentage(item.profitLossPercentage) }}
              </span>
            </template>

            <template v-else-if="header.key === 'actions'">
              <v-btn
                icon
                variant="text"
                color="primary"
                size="small"
                @click="editItem(item)"
                class="mr-2"
              >
                <v-icon>mdi-pencil</v-icon>
                <v-tooltip activator="parent" location="top">Edit</v-tooltip>
              </v-btn>
              <v-btn
                icon
                variant="text"
                color="error"
                size="small"
                @click="deleteItem(item)"
              >
                <v-icon>mdi-delete</v-icon>
                <v-tooltip activator="parent" location="top">Delete</v-tooltip>
              </v-btn>
            </template>

            <template v-else>
              {{ item[header.key] }}
            </template>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Edit Investment Dialog -->
    <v-dialog v-model="editDialog" max-width="600" persistent>
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>Edit Investment</span>
        <v-btn icon @click="closeEditDialog" variant="text">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        <v-form v-model="formValid" @submit.prevent="saveInvestment">
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="editedItem.amount"
                :rules="[v => !!v || 'Amount is required', v => !isNaN(v) || 'Must be a number']"
                label="Amount"
                type="number"
                step="any"
                required
                variant="outlined"
                density="comfortable"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="editedItem.pricePerUnit"
                :rules="[v => !!v || 'Price is required', v => !isNaN(v) || 'Must be a number']"
                label="Price per Unit (USD)"
                type="number"
                step="any"
                required
                variant="outlined"
                density="comfortable"
                :disabled="editedItem.hasUnknownCost"
              >
                <template v-slot:append>
                  <v-tooltip v-if="editedItem.hasUnknownCost" text="Cannot edit price for investments with unknown cost" location="top">
                    <template v-slot:activator="{ props: tooltipProps }">
                      <v-icon v-bind="tooltipProps" icon="mdi-information" size="small" class="ml-1"></v-icon>
                    </template>
                  </v-tooltip>
                </template>
              </v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-menu
                v-model="dateMenu"
                :close-on-content-click="false"
                transition="scale-transition"
                min-width="auto"
              >
                <template v-slot:activator="{ props: menuProps }">
                  <v-text-field
                    v-model="editedItem.purchaseDate"
                    :rules="[v => !!v || 'Date is required']"
                    label="Purchase Date"
                    variant="outlined"
                    density="comfortable"
                    readonly
                    v-bind="menuProps"
                  ></v-text-field>
                </template>
                <v-date-picker
                  v-model="editedItem.purchaseDate"
                  @update:model-value="dateMenu = false"
                ></v-date-picker>
              </v-menu>
            </v-col>
            <v-col cols="12" sm="6">
              <v-textarea
                v-model="editedItem.notes"
                label="Notes"
                variant="outlined"
                density="comfortable"
                rows="2"
                auto-grow
              ></v-textarea>
            </v-col>
          </v-row>
          
          <v-card-actions class="pa-0 mt-4">
            <v-spacer></v-spacer>
            <v-btn 
              color="error" 
              variant="text" 
              @click="closeEditDialog"
              class="mr-2"
            >
              Cancel
            </v-btn>
            <v-btn 
              color="primary" 
              type="submit"
              :loading="isSaving"
              :disabled="!formValid || isSaving"
            >
              Save Changes
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card-text>
    </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, onActivated, onDeactivated } from 'vue';
import { getCryptoIconUrl } from '@/services/cryptoApi';
import { format } from 'date-fns';

const search = ref('');
const loading = ref(true);
const isRefreshing = ref(false);
const lastUpdated = ref(null);
const editDialog = ref(false);
const dateMenu = ref(false);
const formValid = ref(false);
const isSaving = ref(false);

// Edited item state
const editedItem = ref({
  id: null,
  amount: '',
  pricePerUnit: '',
  purchaseDate: format(new Date(), 'yyyy-MM-dd'),
  notes: '',
  hasUnknownCost: false
});

const headers = [
  { title: 'Asset', key: 'asset', sortable: true },
  { title: 'Current Price', key: 'currentPrice', align: 'end', sortable: true },
  { title: 'Amount', key: 'amount', align: 'end', sortable: true },
  { title: 'Cost Basis', key: 'costBasis', align: 'end', sortable: true },
  { title: 'Current Value', key: 'currentValue', align: 'end', sortable: true },
  { title: 'P/L', key: 'profitLoss', align: 'end', sortable: true },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false, width: '120px' },
];

// Use the investment store
import { useInvestmentStore } from '@/stores/investmentStore';

const investmentStore = useInvestmentStore();
const investments = computed(() => investmentStore.investmentsWithCalculations);

// Format currency with debug logging
const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'N/A';
  // Debug logging for suspiciously low values
  if (value > 0 && value < 1) {
    console.warn('Suspiciously low value detected:', value, new Error().stack);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Format percentage
const formatPercentage = (value) => {
  if (value === null || value === undefined) return 'N/A';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

// Format amount with asset symbol
const formatAmount = (investment) => {
  return `${investment.amount} ${investment.assetSymbol || investment.asset.toUpperCase()}`;
};

// Format asset name for display
const formatAssetName = (asset) => {
  const name = asset.toLowerCase();
  return name.charAt(0).toUpperCase() + name.slice(1);
};

// Handle image loading errors
const handleImageError = (event, item) => {
  console.warn(`Failed to load icon for ${item.assetSymbol || item.asset}`);
  // You can set a fallback icon here if needed
  event.target.src = '';
};

// Get asset icon URL with fallback
const getAssetIcon = (symbol) => {
  if (!symbol) return '';
  return getCryptoIconUrl(symbol.toLowerCase());
};

// Get profit/loss color class
const getProfitLossColorClass = (value) => {
  if (value === null || value === undefined) return 'text-grey';
  return value >= 0 ? 'text-success' : 'text-error';
};

let refreshInterval = null;

// Load investments and prices when component is mounted or activated
const loadData = async () => {
  try {
    loading.value = true;
    await loadInvestments();
    lastUpdated.value = new Date();
  } catch (error) {
    console.error('Error loading investments:', error);
  } finally {
    loading.value = false;
  }
};

// Setup auto-refresh
const setupAutoRefresh = () => {
  clearInterval(refreshInterval);
  refreshInterval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      loadInvestments();
    }
  }, 5 * 60 * 1000); // 5 minutes
};

// Component lifecycle hooks
onMounted(async () => {
  await loadData();
  setupAutoRefresh();
});

onActivated(async () => {
  await loadData();
  setupAutoRefresh();
});

onDeactivated(() => {
  clearInterval(refreshInterval);
});

onUnmounted(() => {
  clearInterval(refreshInterval);
});

// Load investments and their current prices
const loadInvestments = async () => {
  try {
    loading.value = true;
    console.log('Before updatePrices - investments:', JSON.parse(JSON.stringify(investmentStore.investments)));
    await investmentStore.updatePrices();
    console.log('After updatePrices - investments:', JSON.parse(JSON.stringify(investmentStore.investments)));
    // Get the most recent update time from investments
    const timestamps = investmentStore.investments
      .map(inv => inv.lastUpdated)
      .filter(Boolean);
    lastUpdated.value = timestamps.length > 0 
      ? Math.max(...timestamps.map(t => new Date(t).getTime())) 
      : null;
  } catch (error) {
    console.error('Error loading investments:', error);
  } finally {
    loading.value = false;
  }
};

// Refresh prices manually
const refreshPrices = async () => {
  try {
    isRefreshing.value = true;
    await loadInvestments();
    lastUpdated.value = new Date();
  } catch (error) {
    console.error('Error refreshing prices:', error);
  } finally {
    isRefreshing.value = false;
    // Reset the auto-refresh timer after manual refresh
    setupAutoRefresh();
  }
};

const editItem = (item) => {
  editedItem.value = {
    id: item.id,
    amount: item.amount,
    pricePerUnit: item.pricePerUnit || '',
    purchaseDate: format(new Date(item.purchaseDate || new Date()), 'yyyy-MM-dd'),
    notes: item.notes || '',
    hasUnknownCost: item.hasUnknownCost || false
  };
  editDialog.value = true;
};

const closeEditDialog = () => {
  editDialog.value = false;
  // Reset form after animation completes
  setTimeout(() => {
    editedItem.value = {
      id: null,
      amount: '',
      pricePerUnit: '',
      purchaseDate: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
      hasUnknownCost: false
    };
  }, 200);
};

const saveInvestment = async () => {
  if (!formValid.value) return;
  
  isSaving.value = true;
  
  try {
    const investmentData = {
      ...editedItem.value,
      amount: parseFloat(editedItem.value.amount),
      pricePerUnit: editedItem.value.hasUnknownCost ? null : parseFloat(editedItem.value.pricePerUnit),
      purchaseDate: new Date(editedItem.value.purchaseDate).toISOString()
    };
    
    await investmentStore.updateInvestment(editedItem.value.id, investmentData);
    
    // Show success message
    // You can use a toast/snackbar here if you have one
    console.log('Investment updated successfully');
    
    // Close the dialog and refresh the list
    closeEditDialog();
    await loadInvestments();
  } catch (error) {
    console.error('Error updating investment:', error);
    // Show error message
  } finally {
    isSaving.value = false;
  }
};

function deleteItem(item) {
  const assetName = item.assetName || item.asset;
  if (confirm(`Are you sure you want to delete this ${assetName} investment?`)) {
    investmentStore.removeInvestment(item.id);
  }
}
</script>

<style scoped>
.v-data-table {
  background-color: transparent;
}

:deep(.v-data-table-header__content) {
  font-weight: 600;
}

:deep(.v-data-table__td) {
  padding: 0 16px;
  height: 60px;
}
</style>

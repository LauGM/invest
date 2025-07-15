import { defineStore } from 'pinia';
import { getCryptoIdBySymbol, getMultipleCryptoPrices } from '@/services/cryptoApi';

export const useInvestmentStore = defineStore('investment', {
  state: () => ({
    investments: JSON.parse(localStorage.getItem('investments')) || [],
    isLoading: false,
    error: null
  }),

  actions: {
    addInvestment(investment) {
      this.investments.push({
        id: Date.now().toString(),
        ...investment,
        createdAt: new Date().toISOString()
      });
      this.saveToLocalStorage();
    },

    removeInvestment(id) {
      this.investments = this.investments.filter(inv => inv.id !== id);
      this.saveToLocalStorage();
    },

    updateInvestment(id, updates) {
      const index = this.investments.findIndex(inv => inv.id === id);
      if (index !== -1) {
        this.investments[index] = { ...this.investments[index], ...updates };
        this.saveToLocalStorage();
      }
    },

    saveToLocalStorage() {
      localStorage.setItem('investments', JSON.stringify(this.investments));
    },

    findInvestmentById(id) {
      return this.investments.find(inv => inv.id === id);
    },

    // Fetches current prices for all investments and updates them
    async updatePrices() {
      this.isLoading = true;
      this.error = null;

      try {
        // Get unique asset symbols from investments
        const uniqueSymbols = {};
        this.investments.forEach(inv => {
          const symbol = (inv.assetSymbol || inv.asset).toLowerCase();
          if (!uniqueSymbols[symbol]) {
            uniqueSymbols[symbol] = {
              symbol,
              id: inv.assetId // Use stored ID if available
            };
          }
        });
        const assetSymbols = Object.values(uniqueSymbols);

        if (this.investments.length === 0) {
          console.log('No investments to update');
          return; // No investments to update
        }

        console.group('=== Starting Price Update ===');
        console.log('All investments before update:', JSON.parse(JSON.stringify(this.investments)));

        // First, get all coin IDs we need to fetch
        const coinIds = [];
        const symbolToCoinId = {};
        const now = new Date().toISOString();

        for (const { symbol, id: existingId } of assetSymbols) {
          try {
            const coinId = existingId || await getCryptoIdBySymbol(symbol);
            if (coinId) {
              symbolToCoinId[symbol] = coinId;
              if (!coinIds.includes(coinId)) {
                coinIds.push(coinId);
              }
            }
          } catch (error) {
            console.error(`Error getting ID for ${symbol}:`, error);
          }
        }

        console.log('Coin IDs to fetch prices for:', coinIds);

        // Then fetch all prices in one go
        let prices = {};
        let priceUpdateSuccessful = false;

        try {
          console.log('Fetching prices for coin IDs:', coinIds);
          const priceData = await getMultipleCryptoPrices(coinIds);

          // Validate the price data
          if (priceData && typeof priceData === 'object') {
            prices = priceData;
            priceUpdateSuccessful = true;
            console.log('Successfully fetched prices:', JSON.stringify(prices, null, 2));
          } else {
            console.warn('Unexpected price data format:', priceData);
          }
        } catch (error) {
          console.error('Error fetching prices, using cached values if available:', error);
          // Don't throw here, we'll continue with any cached prices we have
        }

        // Update investments with current prices
        console.group('Updating investments with new prices');

        const updatedInvestments = this.investments.map(investment => {
          const symbol = (investment.assetSymbol || investment.asset).toLowerCase();
          const coinId = symbolToCoinId[symbol];

          console.group(`Processing investment: ${symbol} (${coinId})`);
          console.log('Current investment data:', JSON.parse(JSON.stringify(investment)));

          if (coinId) {
            if (prices[coinId]?.usd) {
              const newPrice = prices[coinId].usd;
              console.log(`New price from API for ${coinId}:`, newPrice);
              console.log('Previous price:', investment.currentPrice);

              if (newPrice < 1) {
                console.warn(`WARNING: Suspiciously low price for ${symbol} (${coinId}):`, newPrice);
                console.warn('This might indicate an issue with the API response or coin ID mapping');
              }

              const updated = {
                ...investment,
                assetId: coinId, // Store the ID for future updates
                currentPrice: newPrice,
                lastUpdated: now
              };

              console.log('Updated investment:', updated);
              console.groupEnd();
              return updated;
            } else {
              console.warn(`No price data found for ${symbol} (${coinId}) in API response`);
              console.log('Available coin IDs in response:', Object.keys(prices));
            }
          } else {
            console.warn(`No coin ID found for symbol: ${symbol}`);
          }

          // If we couldn't update the price, keep the existing data but update the timestamp
          console.warn(`Could not update price for ${symbol} (${coinId})`);
          console.log('Available coin IDs in response:', Object.keys(prices));
          console.log('Current symbol mappings:', symbolToCoinId);

          // Return the investment with updated timestamp but keep existing price
          return {
            ...investment,
            lastUpdated: now
          };
        });

        console.groupEnd(); // End updating investments

        // Only update the investments array if we successfully got new prices
        if (priceUpdateSuccessful) {
          this.investments = updatedInvestments;
          this.saveToLocalStorage();
          console.log('Successfully updated investments with new prices');
        } else {
          console.warn('Price update not fully successful, keeping existing prices');
        }

        console.log('Final investments state:', JSON.parse(JSON.stringify(this.investments)));
        console.groupEnd(); // End price update

        return priceUpdateSuccessful;
      } catch (error) {
        this.error = 'Failed to update prices. Please check your internet connection and try again.';
        console.error('Error updating prices:', error);
      } finally {
        this.isLoading = false;
      }
    }
  },

  getters: {
    totalInvested(state) {
      return state.investments.reduce((sum, inv) => {
        // Only include in total if we know the purchase price
        return inv.price ? sum + (inv.amount * inv.price) : sum;
      }, 0);
    },

    totalTrackedValue(state) {
      return state.investments.reduce((sum, inv) => {
        // If we have a current price, use it, otherwise use the purchase price if available
        const currentPrice = inv.currentPrice || inv.price;
        return currentPrice ? sum + (inv.amount * currentPrice) : sum;
      }, 0);
    },

    profitLoss(state, getters) {
      return getters.totalTrackedValue - getters.totalInvested;
    },

    profitLossPercentage(state, getters) {
      return getters.totalInvested > 0
        ? (getters.profitLoss / getters.totalInvested) * 100
        : 0;
    },

    // Get investments with calculated values
    investmentsWithCalculations(state) {
      return state.investments.map(inv => {
        const currentPrice = inv.currentPrice || inv.price || 0;
        const amount = parseFloat(inv.amount) || 0;
        const buyPrice = parseFloat(inv.price) || 0;

        const currentValue = amount * currentPrice;
        const costBasis = inv.price ? amount * buyPrice : null;
        const profitLoss = costBasis !== null ? currentValue - costBasis : null;
        const profitLossPercentage = costBasis && costBasis !== 0 ? (profitLoss / costBasis) * 100 : null;

        return {
          ...inv,
          currentPrice,
          currentValue,
          costBasis,
          profitLoss,
          profitLossPercentage,
          hasUnknownCost: !inv.price
        };
      });
    }
  }
});

<script setup>
import { computed } from 'vue';
import { useInvestmentStore } from '@/stores/investmentStore';

const props = defineProps({
  alarm: {
    type: Object,
    required: true
  }
});

const store = useInvestmentStore();
const investment = computed(() => store.findInvestmentById(props.alarm.investmentId));

const checkAlarm = computed(() => {
  if(props.alarm.percentage > ((investment.value.currentPrice * 100 / investment.value.price)-100)){
    return true;
  }
  return false;
})
</script>

<template>
  <v-card
    max-width="250"
    :color="checkAlarm ? 'error' : 'success'"
    v-if="investment"
  >
    <v-card-title class="d-flex align-center">
      <v-icon class="me-2">mdi-alarm</v-icon>
      Alarm
    </v-card-title>

    <v-card-text class="text-subtitle-1">
      Coin name: {{ investment.assetName }}
      <br />
      USD {{ investment.amount }}
      <br />
      Original Price USD: {{ investment.price }}
      <br />
      Current Price USD: {{ investment.currentPrice }}
      <br />
      Alarma de ganancia: {{ props.alarm.percentage }}%
    </v-card-text>
  </v-card>
</template>

<style scoped>
.v-card {
  box-shadow: none;
}
</style>

<template>
  <div class="transaction-list">
    <div v-if="groupedTransactions.length === 0" style="text-align: center; color: #94a3b8; padding: 20px;">
      暂无记录
    </div>
    <div v-for="group in groupedTransactions" :key="group.date" style="margin-bottom: 16px;">
      <div style="font-weight: 600; margin-bottom: 8px;">{{ group.date }}</div>
      <div 
        v-for="tx in group.items" 
        :key="tx.id"
        style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9;"
      >
        <div style="display: flex; align-items: center; gap: 12px;">
          <span :style="{ 
            background: tx.type === 'income' ? '#ecfdf5' : '#fef2f2', 
            color: tx.type === 'income' ? '#065f46' : '#991b1b',
            padding: '4px 8px', 
            borderRadius: '40px', 
            fontSize: '12px'
          }">
            {{ tx.category || tx.mealType }}
          </span>
          <span v-if="tx.note">({{ tx.note }})</span>
        </div>
        <span :style="{ 
          fontWeight: '500',
          color: tx.type === 'income' ? '#10b981' : '#ef4444'
        }">
          {{ tx.type === 'income' ? '+' : '-' }}¥{{ tx.amount || tx.total }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  transactions: {
    type: Array,
    default: () => []
  }
})

const groupedTransactions = computed(() => {
  const groups = {}
  props.transactions.forEach(tx => {
    if (!groups[tx.date]) groups[tx.date] = []
    groups[tx.date].push(tx)
  })
  return Object.keys(groups).sort((a,b) => b.localeCompare(a)).map(date => ({
    date,
    items: groups[date]
  }))
})
</script>

<style scoped>
.transaction-list {
  margin-top: 8px;
}
</style>
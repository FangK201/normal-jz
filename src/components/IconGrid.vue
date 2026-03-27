<template>
  <div class="card">
    <h2>快捷记账</h2>
    <div class="icon-grid">
      <div v-for="category in categories" :key="category.id" class="icon-item-wrapper">
        <div 
          class="icon-item"
          :class="{ selected: selectedCategories.includes(category.id) }"
          @click="toggleCategory(category.id)"
        >
          <span class="icon-name">{{ category.name }}</span>
          <span class="icon-amount">{{ category.minAmount }}-{{ category.maxAmount }}元</span>
        </div>
      </div>
    </div>

    <!-- 金额选择区域 -->
    <div v-if="selectedCategories.length > 0" class="amount-section">
      <div class="flex-between">
        <span class="section-label">选择金额</span>
        <button class="close-btn" @click="clearSelection">×</button>
      </div>
      <div class="amount-grid">
        <button 
          v-for="amount in availableAmounts" 
          :key="amount" 
          class="amount-btn"
          @click="recordExpense(amount)"
        >
          ¥{{ amount }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  categories: Array
})

const emit = defineEmits(['record-expense'])
const selectedCategories = ref([])

function toggleCategory(categoryId) {
  const index = selectedCategories.value.indexOf(categoryId)
  if (index === -1) {
    selectedCategories.value = [categoryId]
  } else {
    selectedCategories.value = []
  }
}

const availableAmounts = computed(() => {
  if (selectedCategories.value.length === 0) return []
  const category = props.categories.find(c => c.id === selectedCategories.value[0])
  if (!category) return []
  
  const amounts = []
  for (let i = category.minAmount; i <= category.maxAmount; i++) {
    amounts.push(i)
  }
  return amounts
})

function recordExpense(amount) {
  if (selectedCategories.value.length === 0) return
  const category = props.categories.find(c => c.id === selectedCategories.value[0])
  if (!category) return
  
  emit('record-expense', {
    category: category.name,
    amount: amount
  })
  
  clearSelection()
}

function clearSelection() {
  selectedCategories.value = []
}
</script>

<style scoped>
.card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  border: 1px solid #eef2f6;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 12px;
}

.icon-item-wrapper {
  text-align: center;
}

.icon-item {
  background: #f8fafc;
  border-radius: 16px;
  padding: 16px 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.icon-item.selected {
  border-color: #d98c2f;
  background: #fff7ef;
}

.icon-name {
  font-size: 16px;
  font-weight: 500;
  color: #1e293b;
}

.icon-amount {
  font-size: 14px;
  color: #64748b;
}

.amount-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #eef2f6;
}

.section-label {
  font-weight: 500;
  color: #1e293b;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #94a3b8;
}

.amount-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: 12px;
}

.amount-btn {
  background: white;
  border: 1px solid #d98c2f;
  border-radius: 8px;
  padding: 12px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  color: #d98c2f;
}

.amount-btn:hover {
  background: #d98c2f;
  color: white;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
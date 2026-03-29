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
      
      <!-- 整数部分 -->
      <div class="amount-section-row">
        <span class="amount-label">整数</span>
        <div class="amount-grid">
          <button 
            v-for="amount in availableAmounts" 
            :key="amount" 
            class="amount-btn"
            :class="{ active: selectedInteger === amount }"
            @click="selectInteger(amount)"
          >
            {{ amount }}
          </button>
        </div>
      </div>
      
      <!-- 小数部分 -->
      <div class="amount-section-row">
        <span class="amount-label">小数</span>
        <div class="amount-grid">
          <button 
            v-for="decimal in availableDecimals" 
            :key="decimal" 
            class="amount-btn"
            :class="{ active: selectedDecimal === decimal }"
            @click="selectDecimal(decimal)"
          >
            0.{{ decimal }}
          </button>
        </div>
      </div>
      
      <!-- 确认按钮 -->
      <div class="confirm-section">
        <button class="confirm-btn" @click="confirmExpense">
          完成
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

// 金额选择相关状态
const selectedInteger = ref(null)
const selectedDecimal = ref(null)

function toggleCategory(categoryId) {
  const index = selectedCategories.value.indexOf(categoryId)
  if (index === -1) {
    selectedCategories.value = [categoryId]
    // 重置金额选择
    selectedInteger.value = null
    selectedDecimal.value = null
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

// 小数选项（移除0选项）
const availableDecimals = [1, 2, 3, 4, 5, 6, 7, 8, 9]

// 计算选中的金额
const selectedAmount = computed(() => {
  if (selectedInteger === null) return 0
  return parseFloat(`${selectedInteger.value}.${selectedDecimal.value || 0}`)
})

// 格式化显示金额
const formattedAmount = computed(() => {
  if (selectedInteger === null) return '¥0'
  const amount = selectedAmount.value
  // 去掉末尾的.0
  if (amount % 1 === 0) {
    return `¥${amount}`
  }
  return `¥${amount.toFixed(1)}`
})

// 选择整数
function selectInteger(amount) {
  selectedInteger.value = amount
}

// 选择小数
function selectDecimal(decimal) {
  selectedDecimal.value = decimal
}

// 确认记账
function confirmExpense() {
  if (selectedCategories.value.length === 0 || selectedInteger.value === null) return
  const category = props.categories.find(c => c.id === selectedCategories.value[0])
  if (!category) return
  
  emit('record-expense', {
    category: category.name,
    amount: selectedAmount.value
  })
  
  clearSelection()
}

function clearSelection() {
  selectedCategories.value = []
  selectedInteger.value = null
  selectedDecimal.value = 0
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

.amount-section-row {
  margin-top: 16px;
}

.amount-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  margin-bottom: 8px;
}

.amount-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: 8px;
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
  text-align: center;
}

.amount-btn:hover {
  background: #d98c2f;
  color: white;
}

.amount-btn.active {
  background: #d98c2f;
  color: white;
}

.confirm-section {
  margin-top: 20px;
}

.confirm-btn {
  width: 100%;
  background: #d98c2f;
  border: none;
  border-radius: 12px;
  padding: 16px;
  font-size: 18px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.confirm-btn:hover {
  background: #c27d1e;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(217, 140, 47, 0.1);
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
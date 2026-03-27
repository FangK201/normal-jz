<template>
  <div class="account-detail-container">
    <div class="header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <h2 style="text-align: center; flex: 1;">{{ account?.name }} 详情</h2>
    </div>

    <!-- 账本基本信息 -->
    <div class="card account-info">
      <div style="display: flex; gap: 24px; margin-top: 12px;">
        <div>
          <span style="color: rgba(255,255,255,0.8); font-size: 14px;">{{ timeRange === 'month' ? '本月' : '本周' }}收入</span>
          <span style="margin-left: 8px; font-weight: 500; color: white;">¥{{ periodIncome }}</span>
        </div>
        <div>
          <span style="color: rgba(255,255,255,0.8); font-size: 14px;">{{ timeRange === 'week' ? '本周' : '本月' }}支出</span>
          <span style="margin-left: 8px; font-weight: 500; color: white;">¥{{ periodExpense }}</span>
        </div>
      </div>
      <div style="margin-top: 16px; display: flex; gap: 8px; justify-content: center;">
        <button 
          class="time-btn" 
          :class="{ active: timeRange === 'month' }" 
          @click="changeTimeRange('month')"
        >
          本月
        </button>
        <button 
          class="time-btn" 
          :class="{ active: timeRange === 'week' }" 
          @click="changeTimeRange('week')"
        >
          本周
        </button>
      </div>
    </div>

    <!-- 支出占比图表 -->
    <div class="card">
      <h3>支出占比</h3>
      <div class="chart-container">
        <canvas ref="pieChart"></canvas>
      </div>
      <div class="legend">
        <div v-for="(item, index) in expenseCategories" :key="index" class="legend-item">
          <span class="legend-color" :style="{ backgroundColor: item.color }"></span>
          <span class="legend-text">{{ item.category }}: ¥{{ item.amount }} ({{ item.percentage }}%)</span>
        </div>
      </div>
    </div>

    <!-- 交易记录 -->
    <div class="card">
      <h3>{{ timeRange === 'month' ? '本月' : '本周' }}交易记录</h3>
      <div v-if="periodTransactions.length === 0" class="empty-state">
        <p>{{ timeRange === 'month' ? '本月' : '本周' }}暂无交易记录</p>
      </div>
      <div v-else class="transaction-list">
        <div v-for="transaction in periodTransactions" :key="transaction.id" class="transaction-item">
          <div class="transaction-info">
            <div style="font-weight: 600;">{{ transaction.category || transaction.mealType }}</div>
            <div style="font-size: 12px; color: #64748b;">{{ transaction.date }}</div>
          </div>
          <div :style="{ color: transaction.type === 'income' ? '#10b981' : '#ef4444' }">
            {{ transaction.type === 'income' ? '+' : '-' }}¥{{ transaction.amount }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storage } from '../utils/storage'
import Chart from 'chart.js/auto'

const router = useRouter()
const route = useRoute()
const pieChart = ref(null)
const chartInstance = ref(null)

const accounts = ref([])
const transactions = ref([])
const accountId = ref(route.params.id)
const timeRange = ref('month') // 'month' 或 'week'

const account = computed(() => {
  return accounts.value.find(acc => acc.id === accountId.value)
})

function getDateRange() {
  const now = new Date()
  if (timeRange.value === 'month') {
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    return {
      start: `${year}-${month}`,
      filter: (date) => date.startsWith(`${year}-${month}`)
    }
  } else {
    // 计算本周的开始和结束日期
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)
    
    return {
      start: weekStart,
      end: weekEnd,
      filter: (date) => {
        const txDate = new Date(date)
        return txDate >= weekStart && txDate < weekEnd
      }
    }
  }
}

const periodIncome = computed(() => {
  const { filter } = getDateRange()
  return transactions.value
    .filter(t => t.type === 'income' && t.accountId === accountId.value && filter(t.date))
    .reduce((sum, t) => sum + t.amount, 0)
})

const periodExpense = computed(() => {
  const { filter } = getDateRange()
  return transactions.value
    .filter(t => t.type === 'expense' && t.accountId === accountId.value && filter(t.date))
    .reduce((sum, t) => sum + t.amount, 0)
})

const periodTransactions = computed(() => {
  const { filter } = getDateRange()
  return transactions.value
    .filter(t => t.accountId === accountId.value && filter(t.date))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
})

const expenseCategories = computed(() => {
  const { filter } = getDateRange()
  
  const expenseTransactions = transactions.value.filter(t => 
    t.type === 'expense' && t.accountId === accountId.value && filter(t.date)
  )
  
  const categoryMap = {}
  expenseTransactions.forEach(t => {
    const category = t.category || t.mealType || '其他'
    if (!categoryMap[category]) {
      categoryMap[category] = 0
    }
    categoryMap[category] += t.amount
  })
  
  const total = Object.values(categoryMap).reduce((sum, amount) => sum + amount, 0)
  const categories = Object.entries(categoryMap).map(([category, amount]) => {
    return {
      category,
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0
    }
  })
  
  // 为每个类别分配颜色
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
    '#f97316', '#14b8a6', '#6366f1', '#f43f5e'
  ]
  
  return categories.map((item, index) => ({
    ...item,
    color: colors[index % colors.length]
  }))
})

function goBack() {
  router.push('/overview')
}

function changeTimeRange(range) {
  timeRange.value = range
  // 延迟渲染图表，确保数据已更新
  setTimeout(() => {
    renderChart()
  }, 50)
}

function renderChart() {
  if (!pieChart.value) return
  
  // 销毁旧图表
  if (chartInstance.value) {
    chartInstance.value.destroy()
  }
  
  const ctx = pieChart.value.getContext('2d')
  chartInstance.value = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: expenseCategories.value.map(item => item.category),
      datasets: [{
        data: expenseCategories.value.map(item => item.amount),
        backgroundColor: expenseCategories.value.map(item => item.color),
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      cutout: '70%'
    }
  })
}

onMounted(() => {
  // 从本地存储加载数据
  accounts.value = storage.get('accounts', [])
  transactions.value = storage.get('transactions', [])
  
  // 延迟渲染图表，确保DOM已加载
  setTimeout(() => {
    renderChart()
  }, 100)
})

watch(expenseCategories, () => {
  renderChart()
}, { deep: true })
</script>

<style scoped>
.account-detail-container {
  padding: 20px;
  background: #f8fafc;
  min-height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  position: relative;
}

.back-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  position: absolute;
  left: 0;
  color: #1e293b;
}

.header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.account-info {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.chart-container {
  height: 300px;
  margin: 20px 0;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 50%;
}

.transaction-list {
  margin-top: 12px;
}

.transaction-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}

.transaction-item:last-child {
  border-bottom: none;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #64748b;
}

.time-btn {
  padding: 6px 16px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.time-btn.active {
  background: white;
  color: #3b82f6;
  font-weight: 500;
}

.time-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.time-btn.active:hover {
  background: white;
}
</style>
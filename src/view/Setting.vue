<template>
  <div class="settings-container">
    <h2>设置</h2>

    <!-- 固定支出设置卡片 -->
    <div class="card">
      <h3>固定支出设置</h3>
      <div v-for="(expense, idx) in fixedExpenses" :key="expense.id" class="flex-between" style="padding:8px 0;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span>{{ expense.name }}</span>
          <span style="color:#94a3b8;">¥{{ expense.amount }}/月</span>
        </div>
        <button class="btn-outline btn" style="padding:4px 12px;" @click="editFixedExpense(idx)">编辑</button>
      </div>
      <button class="btn" style="width:100%; margin-top:12px;" @click="addFixedExpense">+ 添加固定支出</button>
    </div>

    <!-- 账本管理卡片 -->
    <div class="card">
      <h3>账本管理</h3>
      <div v-for="acc in accounts" :key="acc.id" class="flex-between" style="padding:8px 0;">
        <span>{{ acc.name }} ({{ acc.primary ? '主' : '副' }})</span>
        <button class="btn-outline btn" style="padding:4px 12px;">编辑</button>
      </div>
    </div>

    <!-- 数据导出卡片 -->
    <div class="card">
      <h3>数据导出</h3>
      <div class="flex-between" style="margin-bottom:12px;">
        <select v-model="exportPeriod">
          <option value="week">按周</option>
          <option value="month">按月</option>
        </select>
        <button class="btn" @click="exportData">导出Excel</button>
      </div>
      <p style="font-size:12px; color:#94a3b8; margin-top:8px;">包含日期、类别和金额</p>
    </div>

    <!-- 重置向导按钮 -->
    <div class="card">
      <h3>其他设置</h3>
      <button class="btn-outline btn" style="width:100%;" @click="resetSetup">重置首次引导</button>
    </div>

    <!-- 编辑固定支出模态框 -->
    <div v-if="showEditModal" class="modal-overlay" @click="showEditModal = false">
      <div class="modal-content" @click.stop>
        <h3>{{ editingExpense ? '编辑固定支出' : '添加固定支出' }}</h3>
        <div class="form-group">
          <label>名称</label>
          <input v-model="form.name" type="text" />
        </div>
        <div class="form-group">
          <label>金额</label>
          <input v-model.number="form.amount" type="number" placeholder="0" />
        </div>
        <div class="modal-footer">
          <button class="btn-outline" @click="showEditModal = false">取消</button>
          <button class="btn" @click="saveFixedExpense">保存</button>
        </div>
      </div>
    </div>


  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storage } from '../utils/storage'

const router = useRouter()
const accounts = ref([])
const fixedExpenses = ref([])
const exportPeriod = ref('month')
const showEditModal = ref(false)
const editingExpense = ref(null)
const form = ref({ name: '', amount: 0 })

onMounted(() => {
  // 从本地存储加载数据
  accounts.value = storage.get('accounts', [])
  fixedExpenses.value = storage.get('fixedExpenses', [
    { id: 1, name: '话费', amount: 50 },
    { id: 2, name: '水电费', amount: 100 }
  ])
})

function addFixedExpense() {
  editingExpense.value = null
  form.value = { name: '', amount: 0 }
  showEditModal.value = true
}

function editFixedExpense(idx) {
  editingExpense.value = idx
  form.value = { ...fixedExpenses.value[idx] }
  showEditModal.value = true
}

function saveFixedExpense() {
  if (!form.value.name || form.value.amount <= 0) {
    alert('请填写完整信息')
    return
  }
  
  if (editingExpense.value !== null) {
    fixedExpenses.value[editingExpense.value] = { ...form.value }
  } else {
    fixedExpenses.value.push({ ...form.value, id: Date.now() })
  }
  
  storage.set('fixedExpenses', fixedExpenses.value)
  showEditModal.value = false
}

function exportData() {
  const transactions = storage.get('transactions', [])
  const accounts = storage.get('accounts', [])
  const now = new Date()
  let filteredTransactions = []
  
  if (exportPeriod.value === 'week') {
    // 计算本周的开始和结束日期
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)
    
    filteredTransactions = transactions.filter(t => {
      const txDate = new Date(t.date)
      return txDate >= weekStart && txDate < weekEnd
    })
  } else {
    // 计算本月的开始和结束日期
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    filteredTransactions = transactions.filter(t => {
      const txDate = new Date(t.date)
      return txDate >= monthStart && txDate <= monthEnd
    })
  }
  
  // 计算总支出和总收入
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || t.total), 0)
  
  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || t.total), 0)
  
  // 计算总余额
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)
  
  // 生成CSV内容
  let csvContent = '日期,类别,金额,类型\n'
  filteredTransactions.forEach(tx => {
    const type = tx.type === 'income' ? '收入' : '支出'
    csvContent += `${tx.date},${tx.category || tx.mealType},${tx.amount || tx.total},${type}\n`
  })
  
  // 添加总计信息
  csvContent += '\n总计,总收入,,¥' + totalIncome + '\n'
  csvContent += '总计,总支出,,¥' + totalExpense + '\n'
  csvContent += '总计,总余额,,¥' + totalBalance + '\n'
  
  // 创建下载链接
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  const filename = `${exportPeriod.value === 'week' ? '本周' : '本月'}消费记录_${new Date().toISOString().slice(0, 10)}.csv`
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  alert(`已导出${exportPeriod.value === 'week' ? '本周' : '本月'}的消费记录`)
}

function resetSetup() {
  storage.remove('hasSetup')
  router.push('/setup')
}
</script>

<style scoped>
.settings-container {
  padding: 20px;
  background: #f8fafc;
  min-height: 100vh;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  background: #3b82f6;
  color: white;
  font-weight: 500;
  cursor: pointer;
}

.btn-outline {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #64748b;
  cursor: pointer;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 20px;
  width: 90%;
  max-width: 400px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  font-size: 16px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
<template>
  <div class="overview-container">
    <h2>总览</h2>

    <!-- 总账户信息 -->
    <div class="card total-account">
      <div style="font-size: 14px; color: rgba(255,255,255,0.8);">总账户余额</div>
      <div style="font-size: 32px; font-weight: 700; color: white;">¥{{ totalBalance }}</div>
      <div style="display: flex; gap: 24px; margin-top: 12px;">
        <div>
          <span style="color: rgba(255,255,255,0.8); font-size: 14px;">本月总收入</span>
          <span style="margin-left: 8px; font-weight: 500; color: white;">¥{{ totalMonthlyIncome }}</span>
        </div>
        <div>
          <span style="color: rgba(255,255,255,0.8); font-size: 14px;">本月总支出</span>
          <span style="margin-left: 8px; font-weight: 500; color: white;">¥{{ totalMonthlyExpense }}</span>
        </div>
      </div>
    </div>

    <!-- 各账本详情 -->
    <div class="card">
      <h3>各账本详情</h3>
      <div v-for="acc in accounts" :key="acc.id" class="account-detail" @click="goToAccountDetail(acc.id)" style="cursor: pointer;">
        <div class="flex-between">
          <div>
            <div style="font-weight: 600;">{{ acc.name }} ({{ acc.primary ? '主账本' : '副账本' }})</div>
            <div style="font-size: 12px; color: #64748b;">余额 ¥{{ acc.balance }}</div>
          </div>
          <button class="detail-btn">
            详情 <span class="arrow">→</span>
          </button>
        </div>
        <div class="flex-between" style="font-size: 14px; color: #64748b; margin-top: 8px;">
          <span>本月收入: ¥{{ getAccountMonthlyIncome(acc.id) }}</span>
          <span>本月支出: ¥{{ getAccountMonthlyExpense(acc.id) }}</span>
        </div>
      </div>
    </div>

    <!-- 内部转账按钮 -->
    <button class="btn" style="width:100%; margin-top: 16px;" @click="showTransfer = true">内部转账</button>

    <!-- 转账模态框 -->
    <div v-if="showTransfer" class="modal-overlay" @click.self="showTransfer = false">
      <div class="modal transfer-modal">
        <h3 style="margin-bottom: 20px; text-align: center;">内部转账</h3>
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div class="form-group">
            <label>从</label>
            <select v-model="transferFrom" class="form-control">
              <option v-for="acc in accounts" :key="acc.id" :value="acc.id">{{ acc.name }} (¥{{ acc.balance }})</option>
            </select>
          </div>
          <div class="form-group">
            <label>到</label>
            <select v-model="transferTo" class="form-control">
              <option v-for="acc in accounts" :key="acc.id" :value="acc.id">{{ acc.name }} (¥{{ acc.balance }})</option>
            </select>
          </div>
          <div class="form-group">
            <label>金额</label>
            <input type="number" v-model.number="transferAmount" placeholder="0.00" class="form-control" />
          </div>
          <div class="flex-between">
            <button class="btn btn-outline" @click="showTransfer = false">取消</button>
            <button class="btn" @click="doTransfer">确认转账</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storage } from '../utils/storage'

const router = useRouter()
const accounts = ref([])
const transactions = ref([])
const expanded = ref(false)
const showTransfer = ref(false)
const transferFrom = ref('')
const transferTo = ref('')
const transferAmount = ref(0)

const totalBalance = computed(() => {
  return accounts.value.reduce((sum, acc) => sum + acc.balance, 0)
})

const totalMonthlyIncome = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return transactions.value
    .filter(t => t.type === 'income' && t.date.startsWith(`${year}-${month}`))
    .reduce((sum, t) => sum + t.amount, 0)
})

const totalMonthlyExpense = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return transactions.value
    .filter(t => t.type === 'expense' && t.date.startsWith(`${year}-${month}`))
    .reduce((sum, t) => sum + t.amount, 0)
})

function getAccountMonthlyIncome(accountId) {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return transactions.value
    .filter(t => t.type === 'income' && t.accountId === accountId && t.date.startsWith(`${year}-${month}`))
    .reduce((sum, t) => sum + t.amount, 0)
}

function getAccountMonthlyExpense(accountId) {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return transactions.value
    .filter(t => t.type === 'expense' && t.accountId === accountId && t.date.startsWith(`${year}-${month}`))
    .reduce((sum, t) => sum + t.amount, 0)
}

function doTransfer() {
  if (transferFrom.value === transferTo.value) {
    alert('不能转到同一账本')
    return
  }
  if (transferAmount.value <= 0) {
    alert('金额必须大于0')
    return
  }
  const fromAcc = accounts.value.find(a => a.id === transferFrom.value)
  const toAcc = accounts.value.find(a => a.id === transferTo.value)
  if (!fromAcc || !toAcc) {
    alert('账本不存在')
    return
  }
  if (fromAcc.balance < transferAmount.value) {
    alert('余额不足')
    return
  }
  fromAcc.balance -= transferAmount.value
  toAcc.balance += transferAmount.value

  // 添加转账记录
  transactions.value.unshift({
    id: Date.now(),
    date: new Date().toISOString().slice(0, 10),
    type: 'transfer',
    category: '内部转账',
    amount: transferAmount.value,
    accountId: fromAcc.id,
    toAccountId: toAcc.id
  })

  // 保存数据
  storage.set('accounts', accounts.value)
  storage.set('transactions', transactions.value)

  alert('转账成功')
  showTransfer.value = false
}

function goToAccountDetail(accountId) {
  router.push(`/account/${accountId}`)
}

onMounted(() => {
  // 从本地存储加载数据
  accounts.value = storage.get('accounts', [])
  transactions.value = storage.get('transactions', [])
  
  // 设置默认值
  if (accounts.value.length >= 2) {
    transferFrom.value = accounts.value[0].id
    transferTo.value = accounts.value[1].id
  }
})
</script>

<style scoped>
.overview-container {
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

.total-account {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.account-detail {
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}

.account-detail:last-child {
  border-bottom: none;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  background: #3b82f6;
  color: white;
  font-weight: 500;
  cursor: pointer;
}

.btn-outline {
  background: white;
  border: 1px solid #cbd5e1;
  color: #1e293b;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
}

.transfer-modal {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.form-control {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-control select {
  appearance: none;
  background-image: url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" width="292.4" height="292.4"><path fill="%233b82f6" d="M287 69.4a17.6 17.6 0 0 0-13-5.4H18.4c-5 0-9.3 1.8-12.9 5.4A17.6 17.6 0 0 0 0 82.2c0 5 1.8 9.3 5.4 12.9l128 127.9c3.6 3.6 7.8 5.4 12.8 5.4s9.2-1.8 12.8-5.4L287 95c3.5-3.5 5.4-7.8 5.4-12.8 0-5-1.9-9.2-5.5-12.8z"/></svg>');
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
}

.detail-btn {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #3b82f6;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;
}

.detail-btn:hover {
  background: #f0f9ff;
  border-color: #3b82f6;
}

.arrow {
  transition: transform 0.2s ease;
}

.account-detail:hover .arrow {
  transform: translateX(4px);
}
</style>
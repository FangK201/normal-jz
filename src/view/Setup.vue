<template>
  <div class="setup-container">
    <h2>欢迎使用 Fang 记账</h2>
    <p class="subtitle">完成以下设置，让记账更便捷</p>

    <!-- 步骤1：设置固定支出 -->
    <div v-if="step === 1" class="step">
      <h3>📝 设置固定支出</h3>
      <div v-for="(expense, idx) in fixedExpenses" :key="expense.id" class="fixed-expense-item">
        <input v-model="expense.name" placeholder="支出名称" />
        <input v-model.number="expense.amount" type="number" placeholder="金额" />
        <button @click="deleteFixedExpense(idx)">删除</button>
      </div>
      <button class="btn-outline" @click="addFixedExpense">+ 添加固定支出</button>
      <div class="actions">
        <button class="btn" @click="nextStep">下一步</button>
      </div>
    </div>

    <!-- 步骤2：选择支出类别 -->
    <div v-if="step === 2" class="step">
      <h3>📋 设置支出类别</h3>
      <div v-for="(category, idx) in categories" :key="category.id" class="icon-item-edit">
        <input v-model="category.name" placeholder="类别名称" />
        <div class="amount-range">
          <input v-model.number="category.minAmount" type="number" placeholder="最低金额" />
          <span>-</span>
          <input v-model.number="category.maxAmount" type="number" placeholder="最高金额" />
        </div>
        <button @click="deleteCategory(idx)">删除</button>
      </div>
      <button class="btn-outline" @click="addCategory">+ 添加类别</button>
      <div class="actions">
        <button class="btn-outline" @click="step = 1">上一步</button>
        <button class="btn" @click="nextStep">下一步</button>
      </div>
    </div>

    <!-- 步骤3：设置餐别时段 -->
    <div v-if="step === 3" class="step">
      <h3>⏰ 设置餐别时段</h3>
      <div v-for="(meal, idx) in mealTimes" :key="meal.id" class="meal-time-input">
        <label>{{ meal.name }}</label>
        <div class="time-range">
          <input v-model="meal.startTime" type="time" />
          <span>-</span>
          <input v-model="meal.endTime" type="time" />
        </div>
      </div>
      <div class="actions">
        <button class="btn-outline" @click="step = 2">上一步</button>
        <button class="btn" @click="nextStep">下一步</button>
      </div>
    </div>

    <!-- 步骤4：设置主账本和副账本 -->
    <div v-if="step === 4" class="step">
      <h3>💳 设置账本</h3>
      <div v-for="(acc, idx) in accounts" :key="acc.id" class="account-setup-item">
        <div class="account-info">
          <input v-model="acc.name" placeholder="账本名称" />
          <div class="balance-input">
            <input v-model.number="acc.balance" type="number" placeholder="初始余额" />
          </div>
        </div>
        <div class="account-toggle">
          <button 
            class="toggle-btn" 
            :class="{ active: acc.primary }"
            @click="setPrimaryAccount(idx)"
          >
            {{ acc.primary ? '主账本' : '设为主账本' }}
          </button>
          <button v-if="accounts.length > 2" class="delete-btn" @click="deleteAccount(idx)">删除</button>
        </div>
      </div>
      <button class="btn-outline" @click="addAccount">+ 添加账本</button>
      <div class="actions">
        <button class="btn-outline" @click="step = 3">上一步</button>
        <button class="btn" @click="finishSetup">完成并开始记账</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { storage } from '../utils/storage'

const router = useRouter()
const step = ref(1)
const fixedIncome = ref(0)
const fixedExpenses = ref([
  { id: 1, name: '话费', amount: 50 },
  { id: 2, name: '水电费', amount: 100 }
])
const categories = ref([
  { id: 1, name: '早餐', minAmount: 5, maxAmount: 8 },
  { id: 2, name: '午餐', minAmount: 10, maxAmount: 15 },
  { id: 3, name: '晚餐', minAmount: 10, maxAmount: 15 },
  { id: 4, name: '夜宵', minAmount: 5, maxAmount: 10 },
  { id: 5, name: '快递', minAmount: 5, maxAmount: 20 }
])
const accounts = ref([
  { id: 'bank', name: '银行卡', balance: 0, primary: true },
  { id: 'wechat', name: '微信支付', balance: 0, primary: false }
])
const mealTimes = ref([
  { id: 1, name: '早餐', startTime: '05:00', endTime: '09:00' },
  { id: 2, name: '午餐', startTime: '11:00', endTime: '14:00' },
  { id: 3, name: '晚餐', startTime: '17:00', endTime: '20:00' },
  { id: 4, name: '夜宵', startTime: '21:00', endTime: '03:00' }
])

function addCategory() {
  categories.value.push({
    id: Date.now(),
    name: '新类别',
    minAmount: 0,
    maxAmount: 0
  })
}

function deleteCategory(idx) {
  categories.value.splice(idx, 1)
}

function updatePrimaryStatus(idx) {
  // 确保只有一个主账本
  accounts.value.forEach((acc, i) => {
    if (i !== idx) {
      acc.primary = false
    }
  })
}

function setPrimaryAccount(idx) {
  // 设置主账本
  accounts.value.forEach((acc, i) => {
    acc.primary = i === idx
  })
}

function addAccount() {
  accounts.value.push({
    id: Date.now(),
    name: '新账本',
    balance: 0,
    primary: false
  })
}

function deleteAccount(idx) {
  if (accounts.value.length <= 2) {
    alert('至少需要保留两个账本')
    return
  }
  accounts.value.splice(idx, 1)
}

function addFixedExpense() {
  fixedExpenses.value.push({
    id: Date.now(),
    name: '新支出',
    amount: 0
  })
}

function deleteFixedExpense(idx) {
  fixedExpenses.value.splice(idx, 1)
}

function nextStep() {
  step.value += 1
}

function finishSetup() {
  // 将固定收入加到主账本的余额中
  const primaryAccount = accounts.value.find(a => a.primary) || accounts.value[0]
  if (primaryAccount && fixedIncome.value > 0) {
    primaryAccount.balance += fixedIncome.value
  }
  
  // 保存设置
  storage.set('fixedIncome', fixedIncome.value)
  storage.set('fixedExpenses', fixedExpenses.value)
  storage.set('categories', categories.value)
  storage.set('accounts', accounts.value)
  storage.set('mealTimes', mealTimes.value)
  storage.set('hasSetup', true)
  router.push('/')
}
</script>

<style scoped>
.setup-container {
  padding: 20px;
  background: #fff7ef;
  min-height: 100vh;
}
h2 {
  color: #d98c2f;
  text-align: center;
}
.subtitle {
  text-align: center;
  color: #b97f3a;
  margin-bottom: 30px;
}
.step {
  background: white;
  border-radius: 24px;
  padding: 20px;
  margin-top: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.icon-item-edit {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  align-items: center;
}
.icon-item-edit input {
  flex: 1;
  padding: 8px;
  border-radius: 40px;
  border: 1px solid #ffe0b5;
}
.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  gap: 12px;
}
.btn, .btn-outline {
  padding: 8px 20px;
  border-radius: 40px;
  cursor: pointer;
}
.btn {
  background: #d98c2f;
  color: white;
  border: none;
}
.btn-outline {
  background: white;
  border: 1px solid #d98c2f;
  color: #d98c2f;
}
.status {
  color: #d98c2f;
  margin: 10px 0;
}
.balance-input {
  margin-bottom: 16px;
}
.balance-input label {
  display: block;
  margin-bottom: 6px;
}
.balance-input input {
  width: 100%;
  padding: 10px;
  border-radius: 40px;
  border: 1px solid #ffe0b5;
}

.amount-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.amount-range input {
  width: 80px;
  padding: 8px;
  border-radius: 40px;
  border: 1px solid #ffe0b5;
}

.meal-time-input {
  margin-bottom: 16px;
}

.meal-time-input label {
  display: block;
  margin-bottom: 6px;
}

.time-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-range input {
  flex: 1;
  padding: 8px;
  border-radius: 40px;
  border: 1px solid #ffe0b5;
}

.account-setup-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px;
  border: 1px solid #ffe0b5;
  border-radius: 12px;
}

.account-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.account-info input {
  padding: 8px;
  border-radius: 40px;
  border: 1px solid #ffe0b5;
  margin-bottom: 8px;
}

.account-toggle {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toggle-btn {
  padding: 6px 12px;
  border-radius: 40px;
  border: 1px solid #d98c2f;
  background: white;
  color: #d98c2f;
  cursor: pointer;
}

.toggle-btn.active {
  background: #d98c2f;
  color: white;
}

.delete-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.fixed-expense-item {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  align-items: center;
}

.fixed-expense-item input {
  flex: 1;
  padding: 8px;
  border-radius: 40px;
  border: 1px solid #ffe0b5;
}

.fixed-expense-item input[type="number"] {
  width: 100px;
}

.account-toggle {
  margin-left: 12px;
}

.toggle-btn {
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid #d98c2f;
  background: white;
  color: #d98c2f;
  cursor: pointer;
  transition: all 0.3s;
}

.toggle-btn.active {
  background: #d98c2f;
  color: white;
}

.toggle-btn:hover {
  background: #d98c2f;
  color: white;
}
</style>
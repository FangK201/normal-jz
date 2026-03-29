<template>
  <div class="home-container">
    <!-- 主账本信息 -->
    <div class="card primary-account">
      <div class="flex-between">
                <h2>{{ primaryAccount.name }}</h2>
                <div class="account-switch">
                  <button class="switch-btn" @click="showAccountSwitch = true">
                    切换账本
                  </button>
                </div>
              </div>
              
              <!-- 账本切换模态框 -->
              <div v-if="showAccountSwitch" class="modal-overlay" @click.self="showAccountSwitch = false">
                <div class="modal">
                  <h3 style="margin-bottom: 20px;">选择账本</h3>
                  <div style="display: flex; flex-direction: column; gap: 12px;">
                    <div 
                      v-for="acc in accounts" 
                      :key="acc.id"
                      class="account-item"
                      :class="{ active: acc.id === primaryAccount.id }"
                      @click="switchAccount(acc.id)"
                    >
                      <span>{{ acc.name }}</span>
                      <span v-if="acc.primary" class="primary-tag" style="color:white">主账本</span>
                    </div>
                  </div>
                  <div class="actions" style="margin-top: 20px;">
                    <button class="btn" @click="showAccountSwitch = false">关闭</button>
                  </div>
                </div>
              </div>
      <div style="margin-top: 12px;">
        <div style="font-size: 14px; color: #64748b;">当前余额</div>
        <div style="font-size: 36px; font-weight: 700; color: #1e293b;">¥{{ primaryAccount.balance }}</div>
      </div>
      <div style="display: flex; gap: 24px; margin-top: 16px;">
        <div>
          <span style="color: #64748b; font-size: 14px;">本月收入</span>
          <span style="margin-left: 8px; font-weight: 500; color: #10b981;">¥{{ primaryMonthlyIncome }}</span>
        </div>
        <div>
          <span style="color: #64748b; font-size: 14px;">本月支出</span>
          <span style="margin-left: 8px; font-weight: 500; color: #ef4444;">¥{{ primaryMonthlyExpense }}</span>
        </div>
      </div>
    </div>

    <!-- 图标网格组件 -->
    <IconGrid 
      :categories="categories" 
      @record-expense="recordExpense"
    />

    <!-- 语音记账入口 -->
    <div class="card">
      <button class="voice-btn" @click="startVoiceRecognition">
        🎤 语音记账
      </button>
    </div>

    <!-- 交易列表 -->
    <div class="card">
      <h3>最近交易</h3>
      <TransactionList :transactions="recentTransactions" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import TransactionList from '../components/TransactionList.vue'
import IconGrid from '../components/IconGrid.vue'
import { storage } from '../utils/storage'

// 状态
const accounts = ref([])
const transactions = ref([])
const categories = ref([])
const fixedIncome = ref(0)
const fixedExpenses = ref([])

// 计算属性
const primaryAccount = ref({})
const showAccountSwitch = ref(false)

function switchAccount(accountId) {
  const acc = accounts.value.find(a => a.id === accountId)
  if (acc) {
    primaryAccount.value = acc
    // 保存当前选中的账本ID到本地存储
    storage.set('currentAccountId', accountId)
    showAccountSwitch.value = false
  }
}

const primaryMonthlyIncome = computed(() => {
  if (!primaryAccount.value.id) return 0
  return fixedIncome.value + transactions.value
    .filter(t => t.type === 'income' && t.accountId === primaryAccount.value.id && isCurrentMonth(t.date))
    .reduce((sum, t) => sum + t.amount, 0)
})

const primaryMonthlyExpense = computed(() => {
  if (!primaryAccount.value.id) return 0
  return transactions.value
    .filter(t => t.type === 'expense' && t.accountId === primaryAccount.value.id && isCurrentMonth(t.date))
    .reduce((sum, t) => sum + t.amount, 0)
})

const recentTransactions = computed(() => {
  if (!primaryAccount.value.id) return []
  return transactions.value
    .filter(t => t.accountId === primaryAccount.value.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)
})

// 方法
function isCurrentMonth(dateString) {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return dateString.startsWith(`${year}-${month}`)
}

function startVoiceRecognition() {
  // 检查浏览器支持
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    alert('您的浏览器不支持语音识别功能，请使用Chrome或Edge浏览器')
    return
  }
  
  // 检查麦克风权限
  if ('mediaDevices' in navigator) {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => {
        // 权限获取成功，开始语音识别
        startRecognition()
      })
      .catch((error) => {
        console.error('麦克风权限错误:', error)
        alert('请授予麦克风权限以使用语音记账功能')
      })
  } else {
    // 旧浏览器，直接尝试
    startRecognition()
  }
}

function startRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  const recognition = new SpeechRecognition()
  recognition.lang = 'zh-CN'
  recognition.continuous = false
  recognition.interimResults = false
  
  // 移动端友好的提示
  if (/(Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini)/i.test(navigator.userAgent)) {
    // 移动端使用更简洁的提示
    const confirmation = confirm('准备开始语音记账，请说出例如："医疗，花费350元"\n\n点击确定开始录音')
    if (!confirmation) return
  } else {
    alert('请说出记账内容，例如：医疗，花费350元')
  }
  
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript
    console.log('语音识别结果:', transcript)
    parseVoiceInput(transcript)
  }
  
  recognition.onerror = (event) => {
    console.error('语音识别错误:', event.error)
    alert('语音识别失败，请重试')
  }
  
  recognition.onend = () => {
    console.log('语音识别结束')
  }
  
  try {
    recognition.start()
  } catch (error) {
    console.error('启动语音识别失败:', error)
    alert('启动语音识别失败，请重试')
  }
}

function parseVoiceInput(text) {
  // 更灵活的正则表达式，匹配多种格式
  const match = text.match(/(.+?)\s*(?:，|,)?\s*(花费|花了|支出|用了|花掉|消费)(\d+)元/)
  if (match) {
    const category = match[1]
    const amount = parseFloat(match[3])
    
    if (category && amount > 0) {
      recordExpense({ category, amount })
    } else {
      alert('语音输入格式不正确，请重试')
    }
  } else {
    // 尝试更简单的格式：类别 金额
    const simpleMatch = text.match(/(.+?)\s*(\d+)元/)
    if (simpleMatch) {
      const category = simpleMatch[1]
      const amount = parseFloat(simpleMatch[2])
      
      if (category && amount > 0) {
        recordExpense({ category, amount })
      } else {
        alert('语音输入格式不正确，请重试')
      }
    } else {
      alert('语音输入格式不正确，请重试')
    }
  }
}

function recordExpense(data) {
  if (!primaryAccount.value.id) {
    alert('请先选择账本')
    return
  }
  const newTransaction = {
    id: Date.now(),
    date: new Date().toISOString().slice(0, 10),
    type: 'expense',
    category: data.category,
    amount: data.amount,
    accountId: primaryAccount.value.id
  }
  transactions.value.unshift(newTransaction)
  
  // 更新账本余额
  const account = accounts.value.find(a => a.id === primaryAccount.value.id)
  if (account) {
    account.balance -= data.amount
  }
  
  // 保存数据
  saveData()
}

function saveData() {
  storage.set('accounts', accounts.value)
  storage.set('transactions', transactions.value)
}

// 生命周期
onMounted(() => {
  // 从本地存储加载数据
  accounts.value = storage.get('accounts', [
    { id: 'bank', name: '银行卡', balance: 0, primary: true },
    { id: 'wechat', name: '微信支付', balance: 0, primary: false }
  ])
  transactions.value = storage.get('transactions', [])
  categories.value = storage.get('categories', [])
  fixedIncome.value = storage.get('fixedIncome', 0)
  fixedExpenses.value = storage.get('fixedExpenses', [])
  
  // 初始化主账本：优先使用上次选中的账本，然后是主账本，最后是第一个账本
  const currentAccountId = storage.get('currentAccountId')
  let acc
  
  if (currentAccountId) {
    acc = accounts.value.find(a => a.id === currentAccountId)
  }
  
  if (!acc) {
    acc = accounts.value.find(a => a.primary)
  }
  
  if (!acc && accounts.value.length > 0) {
    acc = accounts.value[0]
  }
  
  if (acc) {
    primaryAccount.value = acc
  }
  
  // 检查是否需要自动记录固定收入和支出
  checkAndRecordFixedIncome()
  checkAndRecordFixedExpenses()
})

function checkAndRecordFixedIncome() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const currentMonth = `${year}-${month}`
  
  const hasFixedIncomeRecord = transactions.value.some(t => 
    t.type === 'income' && t.category === '固定收入' && t.date.startsWith(currentMonth) && t.accountId === primaryAccount.value.id
  )
  
  if (!hasFixedIncomeRecord && fixedIncome.value > 0 && primaryAccount.value.id) {
    transactions.value.unshift({
      id: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      type: 'income',
      category: '固定收入',
      amount: fixedIncome.value,
      accountId: primaryAccount.value.id
    })
    
    // 更新当前账本余额
    const account = accounts.value.find(a => a.id === primaryAccount.value.id)
    if (account) {
      account.balance += fixedIncome.value
    }
    
    saveData()
  }
}

function checkAndRecordFixedExpenses() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const currentMonth = `${year}-${month}`
  
  // 检查并记录每个固定支出
  fixedExpenses.value.forEach(expense => {
    const hasExpenseRecord = transactions.value.some(t => 
      t.type === 'expense' && t.category === expense.name && t.date.startsWith(currentMonth) && t.accountId === primaryAccount.value.id
    )
    
    if (!hasExpenseRecord && expense.amount > 0 && primaryAccount.value.id) {
      transactions.value.unshift({
        id: Date.now(),
        date: new Date().toISOString().slice(0, 10),
        type: 'expense',
        category: expense.name,
        amount: expense.amount,
        accountId: primaryAccount.value.id
      })
      
      // 更新当前账本余额
      const account = accounts.value.find(a => a.id === primaryAccount.value.id)
      if (account) {
        account.balance -= expense.amount
      }
    }
  })
  
  // 保存数据
  if (fixedExpenses.value.length > 0) {
    saveData()
  }
}
</script>

<style scoped>
.home-container {
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

.primary-account {
  background: linear-gradient(135deg, #d98c2f 0%, #f5a623 100%);
  color: white;
}

.primary-account h2 {
  color: white;
}

.primary-account .account-tag {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.primary-account div:first-child {
  color: rgba(255, 255, 255, 0.8);
}

.primary-account div:nth-child(2) {
  color: white;
}

.account-switch {
  margin-left: 12px;
}

.switch-btn {
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.3);
  background: rgba(255,255,255,0.1);
  color: white;
  cursor: pointer;
  font-size: 14px;
}

.switch-btn:hover {
  background: rgba(255,255,255,0.2);
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
  border-radius: 16px;
  padding: 32px 24px;
  width: 90%;
  max-width: 420px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: 1px solid #f3f4f6;
}

.modal h3 {
  color: #111827;
  font-weight: 700;
  font-size: 18px;
  margin-bottom: 24px;
  text-align: center;
  letter-spacing: 0.5px;
}
/* weixinzhifu  */
.account-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  border-radius: 12px;
  cursor: pointer;
  color: #000000 !important;
  font-weight: 700;
  font-size: 16px;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid #d1d5db;
  margin-bottom: 12px;
}

.account-item span {
  color: #000000 ;
}

.account-item:hover {
  background: #3b82f6;
  border: 2px solid #3b82f6;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.1), 0 2px 4px -1px rgba(59, 130, 246, 0.06);
}

.account-item:hover span {
  color: white !important;
}

.account-item.active {
  background: #3b82f6;
  border: 2px solid #3b82f6;
  color: white;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.1), 0 2px 4px -1px rgba(59, 130, 246, 0.06);
}

.account-item.active span {
  color: white !important;
}

.account-item.active:hover {
  background: #2563eb;
  border-color: #2563eb;
}

/* 主账本特殊样式 银行卡*/
.account-item:has(.primary-tag):not(.active) {
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid #d1d5db;
  color: #000000;
  font-weight: 700;
}

.account-item:has(.primary-tag):not(.active):hover {
  background: #3b82f6;
  border: 2px solid #3b82f6;
  color: #ffffff;
}

.primary-tag {
  background: #6366f1;
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.account-item.active .primary-tag {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(8px);
}

/* 关闭按钮样式 */
.actions {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

.actions .btn {
  padding: 12px 32px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;
}

.actions .btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.voice-btn {
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  border: none;
  background: #3b82f6;
  color: white;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.voice-btn:hover {
  background: #2563eb;
}
</style>


// <!-- <template>
//   <div style="padding: 20px;">
//     <h1>首页 - 记账应用</h1>
//     <p>如果你能看到这个页面，说明路由配置成功。</p>
//   </div>
// </template> -->
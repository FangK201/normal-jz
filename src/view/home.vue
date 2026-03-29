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
        <div style="font-size: 36px; font-weight: 700; color: #1e293b;">¥{{ formatAmount(primaryAccount.balance) }}</div>
      </div>
      <div style="display: flex; gap: 24px; margin-top: 16px;">
        <div>
          <span style="color: #64748b; font-size: 14px;">本月收入</span>
          <span style="margin-left: 8px; font-weight: 500; color: #10b981;">¥{{ formatAmount(primaryMonthlyIncome) }}</span>
        </div>
        <div>
          <span style="color: #64748b; font-size: 14px;">本月支出</span>
          <span style="margin-left: 8px; font-weight: 500; color: #ef4444;">¥{{ formatAmount(primaryMonthlyExpense) }}</span>
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
      <TransactionList :transactions="recentTransactions" @edit="handleEditTransaction" />
    </div>
  </div>

  <!-- 编辑交易模态框 -->
  <div v-if="showEditModal" class="modal-overlay" @click="showEditModal = false">
    <div class="modal-content" @click.stop>
      <h3>编辑交易</h3>
      <div class="form-group">
        <label>类别</label>
        <input v-model="editForm.category" type="text" />
      </div>
      <div class="form-group">
        <label>金额</label>
        <input v-model.number="editForm.amount" type="number" placeholder="0" />
      </div>
      <div class="form-group">
        <label>日期</label>
        <input v-model="editForm.date" type="date" />
      </div>
      <div class="modal-footer">
        <button class="btn-outline" @click="showEditModal = false">取消</button>
        <button class="btn" @click="saveEditedTransaction">保存</button>
        <button class="btn-danger" @click="deleteTransaction">删除</button>
      </div>
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

// 编辑交易相关状态
const showEditModal = ref(false)
const editForm = ref({})
const currentEditingTransaction = ref(null)

// 金额格式化函数
function formatAmount(amount) {
  return parseFloat(amount).toFixed(2)
}

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
  
  // 检查是否为HTTPS环境
  if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    alert('语音识别功能需要在HTTPS环境下使用，请在安全连接中访问')
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
        if (error.name === 'NotAllowedError') {
          alert('请在浏览器设置中允许麦克风访问权限')
        } else if (error.name === 'NotFoundError') {
          alert('未找到麦克风设备，请检查设备连接')
        } else {
          alert('获取麦克风权限失败，请重试')
        }
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
  
  // 显示格式提示
  const formatMessage = '请按照以下格式说出记账内容：\n\n"类别，花费XX元"\n例如："医疗，花费350元"\n\n3秒后开始录音...'
  
  // 创建倒计时提示
  const countdownElement = document.createElement('div')
  countdownElement.style.position = 'fixed'
  countdownElement.style.top = '50%'
  countdownElement.style.left = '50%'
  countdownElement.style.transform = 'translate(-50%, -50%)'
  countdownElement.style.background = 'rgba(0, 0, 0, 0.8)'
  countdownElement.style.color = 'white'
  countdownElement.style.padding = '20px'
  countdownElement.style.borderRadius = '10px'
  countdownElement.style.zIndex = '1000'
  countdownElement.style.textAlign = 'center'
  countdownElement.style.fontSize = '16px'
  countdownElement.innerHTML = formatMessage
  document.body.appendChild(countdownElement)
  
  // 3秒倒计时
  let countdown = 3
  const countdownInterval = setInterval(() => {
    countdown--
    if (countdown > 0) {
      countdownElement.innerHTML = formatMessage.replace('3秒后开始录音...', `${countdown}秒后开始录音...`)
    } else {
      clearInterval(countdownInterval)
      document.body.removeChild(countdownElement)
      
      // 开始录音
      try {
        recognition.start()
      } catch (error) {
        console.error('启动语音识别失败:', error)
        alert('语音录入失败：启动录音失败，请重试')
      }
    }
  }, 1000)
  
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript
    console.log('语音识别结果:', transcript)
    parseVoiceInput(transcript)
  }
  
  recognition.onerror = (event) => {
    console.error('语音识别错误:', event.error)
    alert('语音录入失败：录音过程中发生错误，请重试')
  }
  
  recognition.onend = () => {
    console.log('语音识别结束')
  }
}

function parseVoiceInput(text) {
  // 同义词映射
  const synonyms = {
    '早饭': '早餐',
    '早点': '早餐',
    '早饭钱': '早餐',
    '早饭费': '早餐',
    '午餐': '午餐',
    '中饭': '午餐',
    '午饭': '午餐',
    '晚饭': '晚餐',
    '晚餐': '晚餐',
    '宵夜': '夜宵',
    '夜宵': '夜宵',
    '打车': '交通',
    '坐车': '交通',
    '打车费': '交通',
    '车费': '交通',
    '购物': '购物',
    '买东西': '购物',
    '网购': '购物',
    '快递': '快递',
    '邮费': '快递',
    '医疗': '医疗',
    '看病': '医疗',
    '买药': '医疗',
    '药费': '医疗'
  }
  
  // 更灵活的正则表达式，匹配多种格式，支持小数
  const match = text.match(/(.+?)\s*(?:，|,)?\s*(花费|花了|支出|用了|花掉|消费|花)(\d+(?:\.\d+)?)元/)
  if (match) {
    let category = match[1].trim()
    const amount = parseFloat(match[3])
    
    // 处理同义词
    if (synonyms[category]) {
      category = synonyms[category]
    }
    
    if (category && amount > 0) {
      recordExpense({ category, amount })
    } else {
      alert('语音录入失败：无法识别金额，请重试')
    }
  } else {
    // 尝试更简单的格式：类别 金额，支持小数
    const simpleMatch = text.match(/(.+?)\s*(\d+(?:\.\d+)?)元/)
    if (simpleMatch) {
      let category = simpleMatch[1].trim()
      const amount = parseFloat(simpleMatch[2])
      
      // 处理同义词
      if (synonyms[category]) {
        category = synonyms[category]
      }
      
      if (category && amount > 0) {
        recordExpense({ category, amount })
      } else {
        alert('语音录入失败：无法识别金额，请重试')
      }
    } else {
      alert('语音录入失败：格式不正确，请说"类别，花费XX元"')
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
  
  // 显示成功提示
  alert(`语音录入成功：${data.category}，花费${data.amount}元`)
}

function saveData() {
  storage.set('accounts', accounts.value)
  storage.set('transactions', transactions.value)
}

// 编辑交易相关函数
function handleEditTransaction(transaction) {
  currentEditingTransaction.value = transaction
  editForm.value = {
    category: transaction.category || transaction.mealType,
    amount: transaction.amount || transaction.total,
    date: transaction.date
  }
  showEditModal.value = true
}

function saveEditedTransaction() {
  if (!editForm.value.category || editForm.value.amount <= 0) {
    alert('请填写完整信息')
    return
  }
  
  const index = transactions.value.findIndex(t => t.id === currentEditingTransaction.value.id)
  if (index !== -1) {
    // 计算金额变化
    const oldAmount = currentEditingTransaction.value.amount || currentEditingTransaction.value.total
    const newAmount = editForm.value.amount
    const amountDiff = newAmount - oldAmount
    
    // 更新交易
    transactions.value[index] = {
      ...currentEditingTransaction.value,
      category: editForm.value.category,
      amount: newAmount,
      date: editForm.value.date
    }
    
    // 更新账本余额
    const account = accounts.value.find(a => a.id === currentEditingTransaction.value.accountId)
    if (account) {
      if (currentEditingTransaction.value.type === 'income') {
        account.balance += amountDiff
      } else {
        account.balance -= amountDiff
      }
    }
    
    saveData()
    showEditModal.value = false
  }
}

function deleteTransaction() {
  if (confirm('确定要删除这笔交易吗？')) {
    const index = transactions.value.findIndex(t => t.id === currentEditingTransaction.value.id)
    if (index !== -1) {
      // 更新账本余额
      const amount = currentEditingTransaction.value.amount || currentEditingTransaction.value.total
      const account = accounts.value.find(a => a.id === currentEditingTransaction.value.accountId)
      if (account) {
        if (currentEditingTransaction.value.type === 'income') {
          account.balance -= amount
        } else {
          account.balance += amount
        }
      }
      
      // 删除交易
      transactions.value.splice(index, 1)
      saveData()
      showEditModal.value = false
    }
  }
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

/* 模态框样式 */
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
  padding: 24px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #4b5563;
}

.form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.modal-footer {
  margin-top: 24px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn-outline {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  color: #4b5563;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-outline:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.btn-danger {
  padding: 8px 16px;
  border: 1px solid #ef4444;
  border-radius: 8px;
  background: #ef4444;
  color: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-danger:hover {
  background: #dc2626;
  border-color: #dc2626;
}
</style>


// <!-- <template>
//   <div style="padding: 20px;">
//     <h1>首页 - 记账应用</h1>
//     <p>如果你能看到这个页面，说明路由配置成功。</p>
//   </div>
// </template> -->
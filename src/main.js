import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/style.css'

// import { storage } from './utils/storage'

// // 初始化数据
// const accounts = storage.get('accounts', [
//   { id: 'bank', name: '银行卡', balance: 0, type: 'bank', primary: true },
//   { id: 'wechat', name: '微信支付', balance: 0, type: 'wechat', primary: false }
// ])
// const icons = storage.get('icons', [])
// const transactions = storage.get('transactions', [])

// // 保存数据
// function saveAccounts() {
//   storage.set('accounts', accounts)
// }

const app = createApp(App)
app.use(router)
app.mount('#app')
// import { createApp } from 'vue'
// import App from './App.vue'
// import router from './router'

// createApp(App).use(router).mount('#app')
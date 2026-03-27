<template>
  <div class="app">
    <router-view />
    <nav class="bottom-nav">
      <router-link to="/" class="nav-item" active-class="router-link-active">
        <span>🏠</span>
        <span>首页</span>
      </router-link>
      <router-link to="/overview" class="nav-item" active-class="router-link-active">
        <span>📊</span>
        <span>总览</span>
      </router-link>
      <router-link to="/settings" class="nav-item" active-class="router-link-active">
        <span>⚙️</span>
        <span>设置</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { reactive, ref, provide, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storage } from './utils/storage'

const router = useRouter()

// 初始化全局数据
const accounts = reactive(storage.get('accounts', [
  { id: 'bank', name: '银行卡', balance: 0, type: 'bank', primary: true },
  { id: 'wechat', name: '微信支付', balance: 0, type: 'wechat', primary: false }
]))
const icons = ref(storage.get('icons', []))
const transactions = ref(storage.get('transactions', []))

// 保存函数
function saveAccounts() {
  storage.set('accounts', accounts)
}
function saveIcons() {
  storage.set('icons', icons.value)
}
function saveTransactions() {
  storage.set('transactions', transactions.value)
}

// 提供全局数据
provide('accounts', accounts)
provide('icons', icons)
provide('transactions', transactions)
provide('saveAccounts', saveAccounts)
provide('saveIcons', saveIcons)
provide('saveTransactions', saveTransactions)

// 首次访问检查
onMounted(() => {
  if (!storage.get('hasSetup')) {
    router.push('/setup')
  }
})
</script>

<style>
@import './assets/style.css';
</style>
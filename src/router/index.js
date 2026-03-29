// import { createRouter, createWebHistory } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import Home from '../view/home.vue'
import Overview from '../view/Overview.vue'
import Settings from '../view/Setting.vue'
import Setup from 'E:/成品/FKone/fangKuai/src/view/Setup.vue'
import AccountDetail from '../view/AccountDetail.vue'
import { storage } from '../utils/storage.js'

const routes = [
  { path: '/', component: Home },
  { path: '/overview', component: Overview },
  { path: '/account/:id', component: AccountDetail },
  { path: '/settings', component: Settings },
  { path: '/setup', component: Setup }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫，检查是否已完成引导设置
router.beforeEach((to, from, next) => {
  const hasSetup = storage.get('hasSetup', false)
  if (!hasSetup && to.path !== '/setup') {
    next('/setup')
  } else {
    next()
  }
})

export default router
// import { createRouter, createWebHistory } from 'vue-router'
// // import home from '../view/home.vue' 
// import Home from '../view/home.vue'

// const routes = [
//   { path: '/', component: Home }
// ]

// const router = createRouter({
//   history: createWebHistory(),
//   routes
// })

// export default router
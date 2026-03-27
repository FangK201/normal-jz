// 模拟图标数据
export const mockIcons = [
  { id: 1, name: '红烧肉', defaultAmount: 18, icon: '🍖', type: 'dish' },
  { id: 2, name: '炒青菜', defaultAmount: 12, icon: '🥬', type: 'dish' },
  { id: 3, name: '番茄鸡蛋', defaultAmount: 15, icon: '🍅', type: 'dish' },
  { id: 4, name: '米饭', defaultAmount: 2, icon: '🍚', type: 'dish' },
  { id: 5, name: '快递', defaultAmount: 10, icon: '📦', type: 'express' }
]

// 模拟账本
export const mockAccounts = [
  { id: 1, name: '银行卡', balance: 3250.50, type: 'bank', primary: true },
  { id: 2, name: '微信支付', balance: 1280.30, type: 'wechat', primary: false }
]

// 模拟交易记录
export const mockTransactions = [
  { id: 1, date: '2025-03-20', items: ['红烧肉', '米饭'], total: 20, accountId: 1, mealType: '午餐' },
  { id: 2, date: '2025-03-20', items: ['快递'], total: 15, accountId: 2, mealType: '其他' },
  { id: 3, date: '2025-03-19', items: ['炒青菜', '番茄鸡蛋'], total: 27, accountId: 1, mealType: '晚餐' }
]

// 模拟每周/每月汇总（动态计算）
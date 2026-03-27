<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>快速记账</h3>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>类别</label>
          <select v-model="form.category">
            <option v-for="cat in categories" :key="cat.id" :value="cat.name">
              {{ cat.name }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>金额</label>
          <input v-model.number="form.amount" type="number" placeholder="0" step="0.01" />
        </div>
        <div class="form-group">
          <label>备注</label>
          <input v-model="form.note" type="text" placeholder="可选" />
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-outline" @click="$emit('close')">取消</button>
        <button class="btn" @click="submitForm">确定</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { storage } from '../utils/storage'

const emit = defineEmits(['close', 'add'])
const form = ref({
  category: '',
  amount: 0,
  note: ''
})
const categories = ref([
  { id: 1, name: '早餐' },
  { id: 2, name: '午餐' },
  { id: 3, name: '晚餐' },
  { id: 4, name: '夜宵' },
  { id: 5, name: '快递' },
  { id: 6, name: '医疗' },
  { id: 7, name: '交通' },
  { id: 8, name: '购物' }
])

onMounted(() => {
  // 从本地存储加载类别
  const savedCategories = storage.get('categories', [])
  if (savedCategories.length > 0) {
    categories.value = savedCategories
  }
  // 设置默认类别
  if (categories.value.length > 0) {
    form.value.category = categories.value[0].name
  }
})

function submitForm() {
  if (!form.value.category || form.value.amount <= 0) {
    alert('请填写完整信息')
    return
  }
  emit('add', form.value)
  form.value = {
    category: categories.value[0]?.name || '',
    amount: 0,
    note: ''
  }
}
</script>

<style scoped>
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

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
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

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  background: #3b82f6;
  color: white;
  font-weight: 500;
  cursor: pointer;
}

.btn-outline {
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #64748b;
  cursor: pointer;
}
</style>
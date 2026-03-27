<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <h3>添加图标（拍照识别）</h3>
      <input type="file" accept="image/*" @change="onImageUpload" />
      <div v-if="recognizing">识别中...</div>
      <div v-if="tempIcons.length">
        <div v-for="(item, idx) in tempIcons" :key="idx">
          <input v-model="item.name" placeholder="名称" />
          <input v-model.number="item.defaultAmount" type="number" placeholder="价格" />
          <button @click="removeItem(idx)">删除</button>
        </div>
        <button @click="saveIcons">添加到图标库</button>
      </div>
      <button @click="manualAdd">手动添加</button>
      <button @click="$emit('close')">取消</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Tesseract from 'tesseract.js'
import { storage } from '../utils/storage'

const emit = defineEmits(['close', 'added'])
const tempIcons = ref([])
const recognizing = ref(false)

async function onImageUpload(event) {
  const file = event.target.files[0]
  if (!file) return
  recognizing.value = true
  try {
    const { data: { text } } = await Tesseract.recognize(file, 'chi_sim')
    const lines = text.split('\n')
    const items = []
    lines.forEach(line => {
      const match = line.match(/([\u4e00-\u9fa5]+)\s*(\d+(?:\.\d+)?)/)
      if (match) {
        items.push({ name: match[1], defaultAmount: parseFloat(match[2]), icon: '🍽️', type: 'dish' })
      }
    })
    tempIcons.value = items
  } catch (err) {
    alert('识别失败')
  } finally {
    recognizing.value = false
  }
}

function manualAdd() {
  tempIcons.value.push({ name: '', defaultAmount: 0, icon: '🍽️', type: 'dish' })
}

function removeItem(idx) {
  tempIcons.value.splice(idx, 1)
}

function saveIcons() {
  const existing = storage.get('icons', [])
  const newIcons = tempIcons.value.filter(i => i.name.trim() !== '' && i.defaultAmount > 0)
  const updated = [...existing, ...newIcons.map(i => ({ ...i, id: Date.now() + Math.random() }))]
  storage.set('icons', updated)
  emit('added')
  emit('close')
}
</script>

<style scoped>
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
  border-radius: 28px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
}
.form-group {
  margin-bottom: 16px;
}
.recognized-item {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}
.recognized-item input {
  flex: 1;
}
.status {
  color: #d98c2f;
  font-size: 14px;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}
.btn, .btn-outline {
  padding: 8px 16px;
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
</style>
<template>
  <div class="widget quick-notes-widget" :class="{ expanded: isExpanded }">
    <div class="widget-header" @click="isExpanded = !isExpanded">
      <span class="widget-icon">📌</span>
      <span class="widget-title">快捷便签</span>
      <span class="expand-icon">{{ isExpanded ? '▼' : '▲' }}</span>
    </div>

    <div class="notes-content" v-show="isExpanded">
      <!-- 添加便签 -->
      <div class="add-note">
        <input
          v-model="newNote"
          @keyup.enter="addNote"
          placeholder="写点什么..."
          class="note-input"
        />
        <select v-model="noteColor" class="color-select">
          <option value="yellow">🟨</option>
          <option value="pink">🟥</option>
          <option value="blue">🟦</option>
          <option value="green">🟩</option>
          <option value="purple">🟪</option>
        </select>
        <button @click="addNote" class="add-btn">+</button>
      </div>

      <!-- 便签列表 -->
      <div class="notes-list">
        <div
          class="note-item"
          :class="note.color"
          v-for="note in notes"
          :key="note.id"
        >
          <span class="note-text">{{ note.text }}</span>
          <button class="note-del" @click="delNote(note.id)">×</button>
        </div>

        <div class="empty-note" v-if="notes.length === 0">
          <span>暂无便签</span>
        </div>
      </div>
    </div>

    <!-- 收起时显示数量 -->
    <div class="collapsed-count" v-if="!isExpanded && notes.length > 0">
      {{ notes.length }} 条便签
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const isExpanded = ref(true)
const newNote = ref('')
const noteColor = ref('yellow')
const notes = ref([])
const STORAGE_KEY = 'perfect-home-quick-notes'

const colorMap = {
  yellow: { bg: 'rgba(255, 235, 59, 0.15)', border: 'rgba(255, 235, 59, 0.3)' },
  pink: { bg: 'rgba(233, 30, 99, 0.15)', border: 'rgba(233, 30, 99, 0.3)' },
  blue: { bg: 'rgba(33, 150, 243, 0.15)', border: 'rgba(33, 150, 243, 0.3)' },
  green: { bg: 'rgba(76, 175, 80, 0.15)', border: 'rgba(76, 175, 80, 0.3)' },
  purple: { bg: 'rgba(156, 39, 176, 0.15)', border: 'rgba(156, 39, 176, 0.3)' }
}

const addNote = () => {
  const text = newNote.value.trim()
  if (!text) return

  notes.value.unshift({
    id: Date.now(),
    text,
    color: noteColor.value
  })

  newNote.value = ''
  saveNotes()
}

const delNote = (id) => {
  notes.value = notes.value.filter(n => n.id !== id)
  saveNotes()
}

const saveNotes = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes.value))
}

const loadNotes = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      notes.value = JSON.parse(saved)
    }
  } catch (e) {
    console.warn('加载便签失败:', e)
  }
}

onMounted(() => {
  loadNotes()
})
</script>

<style lang="scss" scoped>
.quick-notes-widget {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 14px;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--theme-primary);
  }

  &.expanded {
    box-shadow: 0 8px 24px var(--theme-glow);
  }
}

.widget-header {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.widget-icon { font-size: 16px; }

.widget-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--theme-primary);
  flex: 1;
}

.expand-icon {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
}

.notes-content {
  margin-top: 12px;
}

.add-note {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.note-input {
  flex: 1;
  padding: 8px 10px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #fff;
  font-size: 0.8rem;

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }

  &:focus {
    border-color: var(--theme-primary);
    outline: none;
  }
}

.color-select {
  width: 36px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
}

.add-btn {
  width: 32px;
  height: 32px;
  background: var(--theme-gradient);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    transform: scale(1.1);
  }
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
  &::-webkit-scrollbar-thumb { background: rgba(0,212,255,0.4); border-radius: 2px; }
}

.note-item {
  position: relative;
  padding: 10px 12px;
  border-radius: 8px;
  border-left: 3px solid;
  transition: all 0.3s;
  cursor: default;

  &:hover {
    transform: translateX(4px);

    .note-del {
      opacity: 1;
    }
  }

  &.yellow {
    background: rgba(255, 235, 59, 0.1);
    border-left-color: #ffeb3b;
  }

  &.pink {
    background: rgba(233, 30, 99, 0.1);
    border-left-color: #e91e63;
  }

  &.blue {
    background: rgba(33, 150, 243, 0.1);
    border-left-color: #2196f3;
  }

  &.green {
    background: rgba(76, 175, 80, 0.1);
    border-left-color: #4caf50;
  }

  &.purple {
    background: rgba(156, 39, 176, 0.1);
    border-left-color: #9c27b0;
  }
}

.note-text {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.9);
  word-break: break-word;
  padding-right: 20px;
}

.note-del {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 18px;
  height: 18px;
  background: rgba(255, 0, 100, 0.2);
  border: none;
  border-radius: 4px;
  color: #ff6490;
  font-size: 14px;
  cursor: pointer;
  opacity: 0;
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 0, 100, 0.4);
  }
}

.empty-note {
  text-align: center;
  padding: 16px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.8rem;
}

.collapsed-count {
  text-align: center;
  margin-top: 8px;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
}
</style>

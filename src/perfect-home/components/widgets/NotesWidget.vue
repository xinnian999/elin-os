<template>
  <div class="widget notes-widget">
    <div class="widget-header">
      <span class="widget-icon">📝</span>
      <span class="widget-title">便签板</span>
    </div>
    <div class="notes-input">
      <input
        v-model="newNote"
        placeholder="写下你的想法..."
        @keydown.enter="addNote"
      />
      <button @click="addNote">➕</button>
    </div>
    <div class="notes-list">
      <div
        v-for="note in store.notes"
        :key="note.id"
        class="note-item"
      >
        <div class="note-content">{{ note.content }}</div>
        <div class="note-time">{{ formatTime(note.time) }}</div>
        <button class="note-delete" @click="store.delNote(note.id)">✕</button>
      </div>
      <div class="empty" v-if="store.notes.length === 0">
        暂无便签
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { mainStore } from '../../store'

const store = mainStore()
const newNote = ref('')

const addNote = () => {
  if (newNote.value.trim()) {
    store.addNote(newNote.value.trim())
    newNote.value = ''
  }
}

const formatTime = (time) => {
  const date = new Date(time)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
}
</script>

<style lang="scss" scoped>
.notes-widget {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
}

.widget-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.widget-icon {
  font-size: 20px;
}

.widget-title {
  font-size: 1rem;
  font-weight: 600;
  color: #00d4ff;
}

.notes-input {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;

  input {
    flex: 1;
    padding: 12px 16px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    color: #fff;
    font-size: 0.9rem;

    &::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }

    &:focus {
      outline: none;
      border-color: rgba(0, 212, 255, 0.5);
    }
  }

  button {
    width: 44px;
    background: rgba(0, 212, 255, 0.2);
    border: 1px solid rgba(0, 212, 255, 0.3);
    border-radius: 10px;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      background: rgba(0, 212, 255, 0.3);
    }
  }
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 200px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 212, 255, 0.3);
    border-radius: 2px;
  }
}

.note-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  position: relative;
}

.note-content {
  flex: 1;
  font-size: 0.9rem;
  color: #fff;
  word-break: break-all;
}

.note-time {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
}

.note-delete {
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
  flex-shrink: 0;

  &:hover {
    color: #ff0089;
  }
}

.empty {
  text-align: center;
  padding: 20px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.9rem;
}
</style>

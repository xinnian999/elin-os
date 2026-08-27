<template>
  <div class="card notes-card">
    <div class="card-header">
      <span class="title">📝 便签板</span>
      <button class="add-btn" @click="addNote">
        <Icon size="16"><Add /></Icon>
      </button>
    </div>
    <div class="notes-list">
      <div
        v-for="(note, index) in notes"
        :key="index"
        class="note-item"
      >
        <textarea
          v-model="note.content"
          @blur="saveNotes"
          placeholder="写点什么..."
        ></textarea>
        <button class="delete-btn" @click="deleteNote(index)">
          <Icon size="14"><Close /></Icon>
        </button>
      </div>
      <div class="empty" v-if="notes.length === 0">
        暂无便签，点击右上角添加
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Icon } from '@vicons/utils'
import { Add, Close } from '@vicons/ionicons5'

const notes = ref([])

const addNote = () => {
  notes.value.push({ content: '', time: Date.now() })
  saveNotes()
}

const deleteNote = (index) => {
  notes.value.splice(index, 1)
  saveNotes()
}

const saveNotes = () => {
  localStorage.setItem('home-notes', JSON.stringify(notes.value))
}

onMounted(() => {
  const saved = localStorage.getItem('home-notes')
  if (saved) {
    notes.value = JSON.parse(saved)
  }
})
</script>

<style lang="scss" scoped>
.notes-card {
  .notes-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 200px;
    overflow-y: auto;

    @include scrollbar;

    .note-item {
      position: relative;

      textarea {
        width: 100%;
        min-height: 60px;
        padding: 10px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid $border;
        border-radius: $border-radius-sm;
        color: $text;
        font-size: 14px;
        resize: vertical;
        transition: $transition;

        &:focus {
          border-color: $primary;
        }

        &::placeholder {
          color: $text-light;
        }
      }

      .delete-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: rgba(255, 0, 137, 0.2);
        color: $accent;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: $transition;
      }

      &:hover .delete-btn {
        opacity: 1;
      }
    }

    .empty {
      text-align: center;
      color: $text-light;
      padding: 20px;
      font-size: 14px;
    }
  }

  .add-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(0, 212, 255, 0.2);
    color: $primary;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: $transition;

    &:hover {
      background: $primary;
      color: white;
    }
  }
}
</style>

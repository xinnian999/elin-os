<template>
  <div class="widget todo-widget">
    <div class="widget-header">
      <span class="widget-icon">✅</span>
      <span class="widget-title">待办清单</span>
      <span class="todo-count">{{ completedCount }}/{{ todos.length }}</span>
    </div>

    <div class="todo-content">
      <!-- 添加输入 -->
      <div class="todo-input-wrap">
        <input
          v-model="newTodo"
          @keyup.enter="addTodo"
          placeholder="添加待办..."
          class="todo-input"
        />
        <button @click="addTodo" class="add-btn">+</button>
      </div>

      <!-- 待办列表 -->
      <div class="todo-list">
        <div
          class="todo-item"
          v-for="todo in todos"
          :key="todo.id"
          :class="{ done: todo.completed }"
        >
          <label class="checkbox">
            <input type="checkbox" v-model="todo.completed" @change="saveTodos" />
            <span class="checkmark"></span>
          </label>
          <span class="todo-text">{{ todo.text }}</span>
          <button class="del-btn" @click="delTodo(todo.id)">×</button>
        </div>

        <div class="empty-state" v-if="todos.length === 0">
          <span class="empty-icon">📝</span>
          <span class="empty-text">暂无待办</span>
        </div>
      </div>

      <!-- 底部操作 -->
      <div class="todo-footer" v-if="todos.length > 0">
        <button class="clear-btn" @click="clearCompleted" v-if="completedCount > 0">
          清除已完成
        </button>
        <button class="clear-all-btn" @click="clearAll" v-if="todos.length > 0">
          清空全部
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const todos = ref([])
const newTodo = ref('')
const STORAGE_KEY = 'perfect-home-todos'

const completedCount = computed(() => todos.value.filter(t => t.completed).length)

const loadTodos = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      todos.value = JSON.parse(saved)
    }
  } catch (e) {
    console.warn('加载待办失败:', e)
  }
}

const saveTodos = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos.value))
  } catch (e) {
    console.warn('保存待办失败:', e)
  }
}

const addTodo = () => {
  const text = newTodo.value.trim()
  if (!text) return

  todos.value.unshift({
    id: Date.now(),
    text,
    completed: false
  })

  newTodo.value = ''
  saveTodos()
}

const delTodo = (id) => {
  todos.value = todos.value.filter(t => t.id !== id)
  saveTodos()
}

const clearCompleted = () => {
  todos.value = todos.value.filter(t => !t.completed)
  saveTodos()
}

const clearAll = () => {
  if (confirm('确定清空所有待办？')) {
    todos.value = []
    saveTodos()
  }
}

onMounted(() => {
  loadTodos()
})
</script>

<style lang="scss" scoped>
.todo-widget {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 16px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px var(--theme-glow);
    border-color: var(--theme-primary);
  }
}

.widget-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.widget-icon { font-size: 16px; }

.widget-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--theme-primary);
  flex: 1;
}

.todo-count {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.todo-input-wrap {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.todo-input {
  flex: 1;
  padding: 8px 12px;
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

.add-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--theme-gradient);
  border: none;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px var(--theme-glow);
  }
}

.todo-list {
  max-height: 160px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 2px; }
  &::-webkit-scrollbar-thumb { background: rgba(0,212,255,0.4); border-radius: 2px; }
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.06);

    .del-btn {
      opacity: 1;
    }
  }

  &.done {
    .todo-text {
      text-decoration: line-through;
      opacity: 0.4;
    }

    .checkmark {
      background: var(--theme-gradient);
      border-color: transparent;
    }

    .checkmark::after {
      display: block;
    }
  }
}

.checkbox {
  position: relative;
  display: flex;
  cursor: pointer;

  input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
  }
}

.checkmark {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  transition: all 0.3s;

  &::after {
    content: '✓';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #fff;
    font-size: 11px;
    display: none;
  }
}

.todo-text {
  flex: 1;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.9);
  word-break: break-word;
}

.del-btn {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: rgba(255, 0, 100, 0.2);
  border: none;
  color: #ff6490;
  font-size: 14px;
  cursor: pointer;
  opacity: 0;
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 0, 100, 0.4);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 0;
}

.empty-icon { font-size: 28px; opacity: 0.5; }
.empty-text { font-size: 0.8rem; color: rgba(255, 255, 255, 0.4); }

.todo-footer {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.clear-btn, .clear-all-btn {
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.6);

  &:hover {
    border-color: var(--theme-primary);
    color: var(--theme-primary);
  }
}

.clear-all-btn {
  margin-left: auto;

  &:hover {
    border-color: #ff6490;
    color: #ff6490;
  }
}

@media (min-width: 901px) {
  .todo-widget {
    display: flex;
    flex-direction: column;
  }

  .widget-header {
    flex: 0 0 auto;
  }

  .todo-content {
    display: flex;
    flex: 1;
    min-height: 0;
    flex-direction: column;
    justify-content: safe center;
  }

  .todo-list {
    flex: 0 1 auto;
    min-height: 0;
  }
}
</style>

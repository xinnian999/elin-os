<template>
  <div class="config-editor-overlay" @click.self="$emit('close')">
    <div class="config-editor">
      <header class="editor-header">
        <span class="editor-title">⚙️ Elin 在线编辑</span>
        <button class="icon-btn" @click="$emit('close')">✕</button>
      </header>

      <div v-if="!isUnlocked" class="lock-screen">
        <div class="lock-icon">🔐</div>
        <strong>输入主页管理密码</strong>
        <p>登录状态可保留 30 天，密码不会写入浏览器存储。</p>
        <input v-model="passwordInput" class="password-input" type="password" autocomplete="current-password"
          placeholder="请输入管理密码" @keyup.enter="unlock" />
        <button class="primary-btn" :disabled="busy" @click="unlock">{{ busy ? '验证中…' : '解锁编辑器' }}</button>
        <div v-if="error" class="message error">{{ error }}</div>
      </div>

      <div v-else class="editor-content">
        <nav class="editor-tabs">
          <button v-for="tab in tabs" :key="tab.id" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">{{ tab.label }}</button>
        </nav>

        <div v-if="activeTab === 'profile'" class="tab-content">
          <div class="form-grid">
            <label>名称<input v-model="draft.profile.name" /></label>
            <label>身份<input v-model="draft.profile.role" /></label>
            <label class="wide">个人简介<textarea v-model="draft.profile.intro" rows="3" /></label>
            <label>所在地<input v-model="draft.profile.location" /></label>
            <label>邮箱<input v-model="draft.profile.email" type="email" /></label>
            <label class="wide">GitHub<input v-model="draft.profile.githubUrl" type="url" /></label>
            <label class="wide">页脚文案<input v-model="draft.profile.footer" /></label>
          </div>
        </div>

        <div v-if="activeTab === 'home'" class="tab-content">
          <div class="form-grid">
            <label>头像文字 / 图片地址<input v-model="draft.home.site.avatar" /></label>
            <label>建站日期<input v-model="draft.home.site.startDate" type="date" /></label>
            <label>倒计时名称<input v-model="draft.home.site.countdownName" /></label>
            <label>倒计时日期<input v-model="draft.home.site.countdownDate" type="date" /></label>
            <label class="wide">打字机标语（每行一句）<textarea v-model="typewriterText" rows="5" /></label>
          </div>
        </div>

        <div v-if="activeTab === 'projects'" class="tab-content projects-tab">
          <div class="project-list">
            <button v-for="(project, index) in draft.projects" :key="project.id || index" :class="{ active: projectIndex === index }" @click="projectIndex = index">
              <span>{{ project.name || '未命名作品' }}</span><small>{{ project.visible ? '展示' : '隐藏' }}</small>
            </button>
            <button class="add-project" @click="addProject">＋ 添加作品</button>
          </div>

          <div v-if="activeProject" class="project-form">
            <div class="form-grid">
              <label>项目 ID<input v-model="activeProject.id" placeholder="lowercase-id" /></label>
              <label>项目名称<input v-model="activeProject.name" /></label>
              <label>项目类型<input v-model="activeProject.eyebrow" /></label>
              <label>技术栈（逗号分隔）<input :value="activeProject.stack.join(', ')" @input="setStack" /></label>
              <label class="wide">卡片简介<textarea v-model="activeProject.description" rows="2" /></label>
              <label class="wide">详情导语<textarea v-model="activeProject.longDescription" rows="3" /></label>
              <label class="wide">项目图片
                <div class="upload-row"><input v-model="activeProject.image" /><label class="upload-btn">上传<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" @change="uploadImage" /></label></div>
              </label>
              <label class="wide">在线体验<input v-model="activeProject.previewUrl" type="url" /></label>
              <label class="wide">GitHub 源码<input v-model="activeProject.githubUrl" type="url" /></label>
              <label class="wide">安装命令<input v-model="activeProject.installCommand" /></label>
              <div class="details-editor wide">
                <div class="section-title"><span>详情段落</span><button type="button" class="mini-btn" :disabled="activeProject.details.length >= 6" @click="addDetail">＋ 添加</button></div>
                <div v-for="(detail, detailIndex) in activeProject.details" :key="detailIndex" class="detail-row">
                  <input v-model="detail[0]" placeholder="段落标题" />
                  <textarea v-model="detail[1]" rows="2" placeholder="段落内容" />
                  <button type="button" class="detail-remove" @click="removeDetail(detailIndex)">删除</button>
                </div>
                <p v-if="!activeProject.details.length" class="empty-hint">暂无详情段落</p>
              </div>
              <div class="switches wide">
                <label><input v-model="activeProject.visible" type="checkbox" /> 对外展示</label>
                <label><input v-model="activeProject.featured" type="checkbox" @change="setFeatured" /> 通栏主项目</label>
              </div>
            </div>
            <button class="danger-btn" @click="removeProject">删除这个作品</button>
          </div>
        </div>

        <div v-if="activeTab === 'announcement'" class="tab-content">
          <div class="form-grid">
            <label class="switches wide"><input v-model="draft.home.announcement.enabled" type="checkbox" /> 显示公告</label>
            <label class="wide">公告内容<textarea v-model="draft.home.announcement.text" rows="3" /></label>
            <label>滚动速度<input v-model.number="draft.home.announcement.speed" type="number" min="10" max="200" /></label>
            <label>文字颜色<input v-model="draft.home.announcement.textColor" /></label>
            <label class="wide">背景颜色<input v-model="draft.home.announcement.backgroundColor" /></label>
          </div>
        </div>

        <footer class="editor-footer">
          <span :class="['message', saveState === 'error' ? 'error' : '']">{{ status }}</span>
          <div><button class="secondary-btn" @click="$emit('close')">取消</button><button class="primary-btn" :disabled="busy" @click="save">{{ busy ? '保存中…' : '保存到云端' }}</button></div>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { mainStore } from '../store'

defineEmits(['close'])
const store = mainStore()
const tabs = [
  { id: 'profile', label: '👤 简介' }, { id: 'home', label: '🖥️ 主页' },
  { id: 'projects', label: '📁 作品' }, { id: 'announcement', label: '📢 公告' },
]
const activeTab = ref('profile')
const projectIndex = ref(0)
const passwordInput = ref('')
const isUnlocked = ref(false)
const busy = ref(false)
const error = ref('')
const status = ref('修改后将同步到 Cloudflare KV')
const saveState = ref('idle')

const clone = (value) => JSON.parse(JSON.stringify(value))
const draft = reactive({
  profile: clone(store.config?.profile || {}), projects: clone(store.config?.projects || []),
  home: {
    site: {
      avatar: store.config?.site?.avatar || 'E', startDate: store.config?.site?.startDate || '2026-08-20',
      typewriterLines: clone(store.config?.site?.typewriterLines || []),
      countdownName: store.config?.site?.countdownName || '新年倒计时', countdownDate: store.config?.site?.countdownDate || '2027-01-01',
    },
    announcement: clone(store.config?.announcement || {}),
  },
})
const activeProject = computed(() => draft.projects[projectIndex.value] || null)
const typewriterText = computed({
  get: () => draft.home.site.typewriterLines.join('\n'),
  set: (value) => { draft.home.site.typewriterLines = value.split('\n').map((line) => line.trim()).filter(Boolean) },
})

const request = async (url, options = {}) => {
  const response = await fetch(url, { ...options, credentials: 'same-origin', headers: { ...(options.headers || {}) } })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || `请求失败（${response.status}）`)
  return data
}
const unlock = async () => {
  if (!passwordInput.value) { error.value = '请输入管理密码'; return }
  busy.value = true; error.value = ''
  try {
    const data = await request('/api/admin/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: passwordInput.value }) })
    if (data.ok !== true) throw new Error('登录接口未正确响应')
    passwordInput.value = ''
    isUnlocked.value = true
  }
  catch (cause) { error.value = cause.message }
  finally { busy.value = false }
}

const restoreSession = async () => {
  try { const data = await request('/api/admin/session'); isUnlocked.value = data.ok === true }
  catch { isUnlocked.value = false }
}
const addProject = () => {
  draft.projects.push({ id: `project-${Date.now()}`, name: '新作品', eyebrow: '', description: '作品简介', longDescription: '', image: '', stack: [], stars: null, featured: false, visible: true, previewUrl: '', githubUrl: '', installCommand: '', details: [] })
  projectIndex.value = draft.projects.length - 1
}
const removeProject = () => {
  if (draft.projects.length <= 1) { status.value = '至少保留一个作品'; saveState.value = 'error'; return }
  draft.projects.splice(projectIndex.value, 1); projectIndex.value = Math.max(0, projectIndex.value - 1)
}
const setStack = (event) => { activeProject.value.stack = event.target.value.split(',').map((item) => item.trim()).filter(Boolean) }
const setFeatured = () => { if (activeProject.value.featured) draft.projects.forEach((item, index) => { if (index !== projectIndex.value) item.featured = false }) }
const addDetail = () => { if (activeProject.value.details.length < 6) activeProject.value.details.push(['新段落', '段落内容']) }
const removeDetail = (index) => { activeProject.value.details.splice(index, 1) }
const uploadImage = async (event) => {
  const file = event.target.files?.[0]; if (!file) return
  busy.value = true; status.value = '正在上传图片…'
  try {
    const data = await request('/api/admin/media', { method: 'POST', headers: { 'Content-Type': file.type, 'X-File-Name': encodeURIComponent(file.name) }, body: file })
    activeProject.value.image = data.url; status.value = '图片已上传，保存配置后生效'
  } catch (cause) { status.value = cause.message; saveState.value = 'error' }
  finally { busy.value = false; event.target.value = '' }
}
const save = async () => {
  busy.value = true; saveState.value = 'idle'; status.value = '正在同步简介、主页与作品…'
  try {
    await Promise.all([
      request('/api/admin/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profile: draft.profile }) }),
      request('/api/admin/home', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ home: draft.home }) }),
      request('/api/admin/works', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projects: draft.projects }) }),
    ])
    status.value = '已保存，正在刷新页面…'; setTimeout(() => window.location.reload(), 500)
  } catch (cause) { status.value = cause.message; saveState.value = 'error' }
  finally { busy.value = false }
}
const enableContextMenu = () => { document.oncontextmenu = null; document.body.style.userSelect = 'auto' }
const restoreContextMenu = () => { if (store.config?.security?.disableRightClick) document.oncontextmenu = () => false }
onMounted(() => { enableContextMenu(); restoreSession() })
onUnmounted(restoreContextMenu)
</script>

<style lang="scss" scoped>
.config-editor-overlay { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center; padding: 20px; background: rgba(0,0,0,.72); backdrop-filter: blur(8px); }
.config-editor { width: min(920px,96vw); height: min(760px,88vh); display: flex; flex-direction: column; overflow: hidden; color: #fff; background: rgba(16,20,38,.96); border: 1px solid rgba(0,212,255,.32); border-radius: 18px; box-shadow: 0 24px 80px rgba(0,0,0,.55); }
.editor-header,.editor-footer { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 15px 20px; border-bottom: 1px solid rgba(255,255,255,.1); }
.editor-footer { border-top: 1px solid rgba(255,255,255,.1); border-bottom: 0; }.editor-title { color: var(--theme-primary); font-weight: 700; }
.icon-btn { border: 0; border-radius: 8px; width: 32px; height: 32px; color: #fff; background: rgba(255,255,255,.1); cursor: pointer; }
.lock-screen { margin: auto; width: min(380px,90%); display: flex; flex-direction: column; align-items: center; gap: 14px; text-align: center; }.lock-screen p { margin: 0; color: rgba(255,255,255,.58); font-size: .84rem; }.lock-icon { font-size: 48px; }
.password-input,input,textarea { width: 100%; box-sizing: border-box; padding: 10px 12px; color: #fff; background: rgba(0,0,0,.28); border: 1px solid rgba(255,255,255,.14); border-radius: 8px; outline: none; }input:focus,textarea:focus { border-color: var(--theme-primary); }
.editor-content { min-height: 0; flex: 1; display: flex; flex-direction: column; }.editor-tabs { display: flex; gap: 8px; padding: 12px 16px; overflow-x: auto; border-bottom: 1px solid rgba(255,255,255,.1); }
.editor-tabs button,.project-list button { flex: none; padding: 8px 14px; color: rgba(255,255,255,.72); background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); border-radius: 8px; cursor: pointer; }.editor-tabs button.active,.project-list button.active { color: var(--theme-primary); border-color: var(--theme-primary); background: rgba(0,212,255,.14); }
.tab-content { min-height: 0; flex: 1; padding: 18px; overflow: auto; }.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }.form-grid>label { display: grid; gap: 7px; color: rgba(255,255,255,.65); font-size: .8rem; }.wide { grid-column: 1/-1; }textarea { resize: vertical; }
.projects-tab { display: grid; grid-template-columns: 190px 1fr; gap: 18px; }.project-list { display: flex; flex-direction: column; gap: 8px; }.project-list button { display: flex; justify-content: space-between; gap: 8px; text-align: left; }.project-list small { color: rgba(255,255,255,.4); }.project-form { min-width: 0; }
.switches { display: flex!important; align-items: center; gap: 20px!important; }.switches label { display: flex; align-items: center; gap: 7px; }.switches input { width: auto; }.upload-row { display: flex; gap: 8px; }.upload-btn { flex: none; padding: 10px 14px; border-radius: 8px; color: var(--theme-primary); background: rgba(0,212,255,.12); cursor: pointer; }.upload-btn input { display: none; }
.details-editor { display: grid; gap: 10px; }.section-title { display: flex; align-items: center; justify-content: space-between; color: rgba(255,255,255,.65); font-size: .8rem; }.detail-row { display: grid; grid-template-columns: 150px 1fr auto; gap: 8px; align-items: start; }.mini-btn,.detail-remove { padding: 7px 10px; border: 1px solid rgba(0,212,255,.25); border-radius: 7px; color: var(--theme-primary); background: rgba(0,212,255,.1); cursor: pointer; }.detail-remove { color: #ff7199; border-color: rgba(255,113,153,.25); background: rgba(255,113,153,.1); }.empty-hint { margin: 0; color: rgba(255,255,255,.4); font-size: .8rem; }
.primary-btn,.secondary-btn,.danger-btn { padding: 9px 18px; border: 0; border-radius: 8px; color: #fff; cursor: pointer; }.primary-btn { background: var(--theme-gradient); }.secondary-btn { margin-right: 8px; background: rgba(255,255,255,.1); }.danger-btn { margin-top: 18px; background: rgba(255,50,100,.24); }button:disabled { opacity: .55; cursor: wait; }.message { min-height: 1em; color: rgba(255,255,255,.6); font-size: .82rem; }.message.error { color: #ff7199; }
@media (max-width:700px) { .config-editor-overlay { padding: 8px; }.config-editor { width: 100%; height: 94vh; }.form-grid { grid-template-columns: 1fr; }.wide { grid-column: auto; }.projects-tab { display: block; }.project-list { flex-direction: row; overflow-x: auto; margin-bottom: 16px; }.detail-row { grid-template-columns: 1fr; }.editor-footer { align-items: flex-start; flex-direction: column; } }
</style>

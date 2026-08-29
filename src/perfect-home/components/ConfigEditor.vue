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
            <div class="contacts-editor wide">
              <div class="section-title contacts-title">
                <div>
                  <span>联系方式</span>
                  <small>开启需要展示的平台，再填写链接或上传二维码</small>
                </div>
                <span class="enabled-count">已开启 {{ draft.profile.contacts.length }} 项</span>
              </div>
              <div class="contact-preset-grid">
                <section
                  v-for="preset in orderedContactPresets"
                  :key="preset.id"
                  :class="['contact-preset', { enabled: contactEnabled(preset.id) }]"
                  :style="{ '--contact-color': preset.color }"
                >
                  <div class="contact-preset-head">
                    <span class="contact-brand-icon"><BrandIcon :name="preset.icon" /></span>
                    <span class="contact-brand-name">{{ preset.name }}</span>
                    <span v-if="contactEnabled(preset.id)" class="contact-order-actions">
                      <button
                        type="button"
                        :aria-label="`${preset.name}上移`"
                        :disabled="!canMoveContact(preset.id, -1)"
                        @click="moveContact(preset.id, -1)"
                      >↑</button>
                      <button
                        type="button"
                        :aria-label="`${preset.name}下移`"
                        :disabled="!canMoveContact(preset.id, 1)"
                        @click="moveContact(preset.id, 1)"
                      >↓</button>
                    </span>
                    <button
                      type="button"
                      class="contact-toggle"
                      role="switch"
                      :aria-checked="contactEnabled(preset.id)"
                      :aria-label="`${contactEnabled(preset.id) ? '关闭' : '开启'}${preset.name}`"
                      @click="toggleContact(preset)"
                    ><span /></button>
                  </div>
                  <div v-if="contactEnabled(preset.id)" class="contact-preset-body">
                    <template v-if="preset.type === 'qrcode'">
                      <label class="contact-upload">
                        <span>{{ contactFor(preset.id).value ? '重新上传二维码' : '上传二维码' }}</span>
                        <input type="file" accept="image/png,image/jpeg,image/webp" @change="uploadContactQr($event, contactFor(preset.id))" />
                      </label>
                      <img v-if="contactFor(preset.id).value" :src="contactFor(preset.id).value" :alt="`${preset.name}二维码预览`" class="contact-qr-preview" />
                      <span v-else class="contact-empty">尚未上传</span>
                    </template>
                    <input
                      v-else
                      ref="contactInputs"
                      :data-contact-id="preset.id"
                      :value="contactFor(preset.id)?.value || ''"
                      :type="preset.type === 'email' ? 'email' : preset.id === 'phone' ? 'tel' : 'text'"
                      :inputmode="preset.id === 'phone' ? 'tel' : undefined"
                      :placeholder="preset.placeholder"
                      @input="setContactValue(preset.id, $event.currentTarget.value)"
                      @change="setContactValue(preset.id, $event.currentTarget.value)"
                    />
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'home'" class="tab-content">
          <div class="form-grid">
            <label>头像文字 / 图片地址<input v-model="draft.home.site.avatar" /></label>
            <label>建站日期<input v-model="draft.home.site.startDate" type="date" /></label>
            <label>倒计时名称<input v-model="draft.home.site.countdownName" /></label>
            <label>倒计时日期<input v-model="draft.home.site.countdownDate" type="date" /></label>
            <label class="wide">打字机标语（每行一句）<textarea v-model="typewriterText" rows="5" /></label>
            <div class="section-title footer-settings-title wide">
              <div>
                <span>页脚信息</span>
                <small>留空可隐藏对应内容；版权文案支持使用 {year} 表示当前年份</small>
              </div>
            </div>
            <label>备案文字<input v-model="draft.home.footer.filingText" maxlength="100" /></label>
            <label>备案链接<input v-model="draft.home.footer.filingUrl" type="url" maxlength="500" placeholder="https://beian.miit.gov.cn/" /></label>
            <label class="wide">版权文案<input v-model="draft.home.footer.copyrightText" maxlength="120" placeholder="Copyright © {year} Elin" /></label>
            <label>UI 署名文字<input v-model="draft.home.footer.uiCreditText" maxlength="100" /></label>
            <label>UI 署名链接<input v-model="draft.home.footer.uiCreditUrl" type="url" maxlength="500" placeholder="https://github.com/…" /></label>
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

        <div v-if="activeTab === 'music'" class="tab-content">
          <div class="music-editor">
            <div class="music-editor-header">
              <div>
                <strong>万万静听歌单</strong>
                <p>音频文件保存到 Cloudflare R2；歌名、歌手与排序随主页配置保存。</p>
              </div>
              <label class="upload-btn music-upload-btn" :class="{ disabled: busy || draft.home.music.playlist.length >= 20 }">
                <span>＋ 上传并添加歌曲</span>
                <input
                  class="file-input-overlay"
                  type="file"
                  aria-label="上传并添加歌曲"
                  accept="audio/mpeg,audio/mp4,audio/aac,audio/ogg,audio/wav,audio/webm,audio/flac,.mp3,.m4a,.aac,.ogg,.wav,.webm,.flac"
                  :disabled="busy || draft.home.music.playlist.length >= 20"
                  @change="uploadSong($event)"
                />
              </label>
            </div>

            <p v-if="!draft.home.music.playlist.length" class="music-empty">暂无歌曲。上传音频后，填写歌名并保存即可在主页播放。</p>

            <div class="music-track-list">
              <section v-for="(song, index) in draft.home.music.playlist" :key="song.id" class="music-track-card">
                <div class="music-track-head">
                  <span class="music-track-index">{{ String(index + 1).padStart(2, '0') }}</span>
                  <label class="music-track-state"><input v-model="song.enabled" type="checkbox" /> 在播放器中展示</label>
                  <div class="music-track-actions">
                    <button type="button" :disabled="index === 0" :aria-label="`${song.name || '歌曲'}上移`" @click="moveSong(index, -1)">↑</button>
                    <button type="button" :disabled="index === draft.home.music.playlist.length - 1" :aria-label="`${song.name || '歌曲'}下移`" @click="moveSong(index, 1)">↓</button>
                    <button type="button" class="remove-song" :aria-label="`移除${song.name || '歌曲'}`" @click="removeSong(index)">移除</button>
                  </div>
                </div>
                <div class="form-grid music-track-fields">
                  <label>歌曲名<input v-model="song.name" maxlength="100" /></label>
                  <label>歌手（可选）<input v-model="song.artist" maxlength="100" /></label>
                  <div class="music-source-field wide">
                    <span>R2 音频</span>
                    <div class="upload-row">
                      <input :value="musicSourceName(song.url)" class="source-input" aria-label="R2 音频文件" readonly />
                      <label class="upload-btn" :class="{ disabled: busy }">
                        <span>替换音频</span>
                        <input
                          class="file-input-overlay"
                          type="file"
                          :aria-label="`替换${song.name || '歌曲'}音频`"
                          accept="audio/mpeg,audio/mp4,audio/aac,audio/ogg,audio/wav,audio/webm,audio/flac,.mp3,.m4a,.aac,.ogg,.wav,.webm,.flac"
                          :disabled="busy"
                          @change="uploadSong($event, song)"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </section>
            </div>
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
          <div class="footer-actions">
            <button v-if="isLocal" class="sync-btn" :disabled="busy" @click="syncProduction">↻ 一键同步线上数据</button>
            <button class="secondary-btn" @click="$emit('close')">取消</button>
            <button class="primary-btn" :disabled="busy" @click="save">{{ busy ? '处理中…' : '保存到云端' }}</button>
          </div>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { mainStore } from '../store'
import BrandIcon from './BrandIcon.vue'
import { CONTACT_PRESETS, normalizePresetContacts, syncContactInputValues } from '../utils/contact-presets'
import { makeConfigFromSaveResults } from '../utils/config'

const emit = defineEmits(['close'])
const store = mainStore()
const tabs = [
  { id: 'profile', label: '👤 简介' }, { id: 'home', label: '🖥️ 主页' },
  { id: 'projects', label: '📁 作品' }, { id: 'music', label: '🎵 万万静听' },
  { id: 'announcement', label: '📢 公告' },
]
const activeTab = ref('profile')
const projectIndex = ref(0)
const passwordInput = ref('')
const isUnlocked = ref(false)
const busy = ref(false)
const error = ref('')
const status = ref('修改后将同步到 Cloudflare KV')
const saveState = ref('idle')
const contactInputs = ref([])
const isLocal = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(window.location.hostname)

const clone = (value) => JSON.parse(JSON.stringify(value))
const initialProfile = clone(store.config?.profile || {})
initialProfile.contacts = normalizePresetContacts(initialProfile.contacts, initialProfile)
const defaultFooter = {
  filingText: '冀ICP备2025100393号-1',
  filingUrl: 'https://beian.miit.gov.cn/',
  copyrightText: 'Copyright © {year} Elin',
  uiCreditText: 'UI based on Perfect Home',
  uiCreditUrl: 'https://github.com/327261086/perfect-home',
}
const draft = reactive({
  profile: initialProfile, projects: clone(store.config?.projects || []),
  home: {
    site: {
      avatar: store.config?.site?.avatar || 'E', startDate: store.config?.site?.startDate || '2026-08-20',
      typewriterLines: clone(store.config?.site?.typewriterLines || []),
      countdownName: store.config?.site?.countdownName || '新年倒计时', countdownDate: store.config?.site?.countdownDate || '2027-01-01',
    },
    announcement: clone(store.config?.announcement || {}),
    footer: { ...defaultFooter, ...clone(store.config?.footer || {}) },
    music: { playlist: clone(store.config?.music?.playlist || []) },
  },
})
const activeProject = computed(() => draft.projects[projectIndex.value] || null)
const orderedContactPresets = computed(() => {
  const presetMap = new Map(CONTACT_PRESETS.map((preset) => [preset.id, preset]))
  const enabled = draft.profile.contacts.map((contact) => presetMap.get(contact.id)).filter(Boolean)
  const enabledIds = new Set(enabled.map((preset) => preset.id))
  return [...enabled, ...CONTACT_PRESETS.filter((preset) => !enabledIds.has(preset.id))]
})
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
const contactFor = (id) => draft.profile.contacts.find((contact) => contact.id === id)
const contactIndex = (id) => draft.profile.contacts.findIndex((contact) => contact.id === id)
const contactEnabled = (id) => Boolean(contactFor(id))
const setContactValue = (id, value) => {
  const contact = contactFor(id)
  if (contact) contact.value = value
}
const syncContactInputs = () => {
  syncContactInputValues(draft.profile.contacts, contactInputs.value)
}
const canMoveContact = (id, direction) => {
  const index = contactIndex(id)
  const target = index + direction
  return index >= 0 && target >= 0 && target < draft.profile.contacts.length
}
const moveContact = (id, direction) => {
  const index = contactIndex(id)
  const target = index + direction
  if (!canMoveContact(id, direction)) return
  const [contact] = draft.profile.contacts.splice(index, 1)
  draft.profile.contacts.splice(target, 0, contact)
}
const toggleContact = (preset) => {
  const existingIndex = draft.profile.contacts.findIndex((contact) => contact.id === preset.id)
  if (existingIndex >= 0) {
    draft.profile.contacts.splice(existingIndex, 1)
    return
  }
  const fallbackValue = preset.id === 'github' ? draft.profile.githubUrl : preset.id === 'email' ? draft.profile.email : ''
  draft.profile.contacts.push({ id: preset.id, name: preset.name, type: preset.type, value: fallbackValue || '', icon: preset.icon, color: preset.color })
}
const uploadImage = async (event) => {
  const file = event.target.files?.[0]; if (!file) return
  busy.value = true; status.value = '正在上传图片…'
  try {
    const data = await request('/api/admin/media', { method: 'POST', headers: { 'Content-Type': file.type, 'X-File-Name': encodeURIComponent(file.name) }, body: file })
    activeProject.value.image = data.url; status.value = '图片已上传，保存配置后生效'
  } catch (cause) { status.value = cause.message; saveState.value = 'error' }
  finally { busy.value = false; event.target.value = '' }
}
const uploadContactQr = async (event, contact) => {
  const file = event.target.files?.[0]; if (!file) return
  busy.value = true; status.value = '正在上传二维码…'; saveState.value = 'idle'
  try {
    const data = await request('/api/admin/media', { method: 'POST', headers: { 'Content-Type': file.type, 'X-File-Name': encodeURIComponent(file.name) }, body: file })
    contact.value = data.url; status.value = '二维码已上传，保存配置后生效'
  } catch (cause) { status.value = cause.message; saveState.value = 'error' }
  finally { busy.value = false; event.target.value = '' }
}
const audioContentType = (file) => {
  const normalizedType = file.type.toLowerCase()
  if (new Set([
    'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/ogg',
    'application/ogg', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/flac', 'audio/x-flac',
  ]).has(normalizedType)) return normalizedType
  const extension = file.name.split('.').pop()?.toLowerCase()
  return {
    mp3: 'audio/mpeg', m4a: 'audio/mp4', aac: 'audio/aac', ogg: 'audio/ogg',
    wav: 'audio/wav', webm: 'audio/webm', flac: 'audio/flac',
  }[extension] || 'application/octet-stream'
}
const trackNameFromFile = (fileName) => fileName.replace(/\.[^.]+$/, '').trim().slice(0, 100) || '新歌曲'
const uploadSong = async (event, song = null) => {
  const file = event.target.files?.[0]
  if (!file) return
  if (file.size > 50 * 1024 * 1024) {
    status.value = '音频不能超过 50 MB'; saveState.value = 'error'; event.target.value = ''; return
  }
  busy.value = true; saveState.value = 'idle'; status.value = `正在上传 ${file.name} 到 R2…`
  try {
    const data = await request('/api/admin/music', {
      method: 'POST',
      headers: { 'Content-Type': audioContentType(file), 'X-File-Name': encodeURIComponent(file.name) },
      body: file,
    })
    if (song) {
      song.url = data.url
      if (!song.name) song.name = trackNameFromFile(file.name)
    } else {
      draft.home.music.playlist.push({
        id: `track-${crypto.randomUUID()}`,
        name: trackNameFromFile(file.name),
        artist: '',
        url: data.url,
        enabled: true,
      })
    }
    status.value = '音频已上传到 R2，点击保存后更新主页歌单'
  } catch (cause) { status.value = cause.message; saveState.value = 'error' }
  finally { busy.value = false; event.target.value = '' }
}
const moveSong = (index, direction) => {
  const target = index + direction
  if (target < 0 || target >= draft.home.music.playlist.length) return
  const [song] = draft.home.music.playlist.splice(index, 1)
  draft.home.music.playlist.splice(target, 0, song)
}
const removeSong = (index) => { draft.home.music.playlist.splice(index, 1) }
const musicSourceName = (url = '') => {
  try { return decodeURIComponent(url.split('/').pop() || url) }
  catch { return url }
}
const syncProduction = async () => {
  busy.value = true; saveState.value = 'idle'; status.value = '正在从线上 KV 读取最新配置…'
  try {
    const syncOrigin = `http://${window.location.hostname === 'localhost' ? 'localhost' : '127.0.0.1'}:8790`
    const response = await fetch(`${syncOrigin}/api/sync-production`, { method: 'POST' })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error || `线上数据读取失败（${response.status}）`)
    const updates = [
      request('/api/admin/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profile: data.profile }) }),
      request('/api/admin/works', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projects: data.projects }) }),
    ]
    if (data.home) updates.push(request('/api/admin/home', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ home: data.home }) }))
    await Promise.all(updates)
    status.value = `已同步 ${data.projects.length} 个作品，正在刷新本地页面…`
    setTimeout(() => window.location.reload(), 550)
  } catch (cause) { status.value = cause.message; saveState.value = 'error' }
  finally { busy.value = false }
}
const save = async () => {
  syncContactInputs()
  busy.value = true; saveState.value = 'idle'; status.value = '正在同步简介、主页与作品…'
  try {
    draft.profile.githubUrl = contactFor('github')?.value || ''
    draft.profile.email = contactFor('email')?.value || ''
    const profileResult = await request('/api/admin/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profile: draft.profile }) })
    const [homeResult, worksResult] = await Promise.all([
      request('/api/admin/home', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ home: draft.home }) }),
      request('/api/admin/works', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projects: draft.projects }) }),
    ])
    store.setConfig(makeConfigFromSaveResults(profileResult, worksResult, homeResult))
    status.value = '已保存，页面内容已更新'; setTimeout(() => emit('close'), 500)
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
.password-input,input,textarea,select { width: 100%; box-sizing: border-box; padding: 10px 12px; color: #fff; background: rgba(0,0,0,.28); border: 1px solid rgba(255,255,255,.14); border-radius: 8px; outline: none; }input:focus,textarea:focus,select:focus { border-color: var(--theme-primary); }
.editor-content { min-height: 0; flex: 1; display: flex; flex-direction: column; }.editor-tabs { display: flex; gap: 8px; padding: 12px 16px; overflow-x: auto; border-bottom: 1px solid rgba(255,255,255,.1); }
.editor-tabs button,.project-list button { flex: none; padding: 8px 14px; color: rgba(255,255,255,.72); background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); border-radius: 8px; cursor: pointer; }.editor-tabs button.active,.project-list button.active { color: var(--theme-primary); border-color: var(--theme-primary); background: rgba(0,212,255,.14); }
.tab-content { min-height: 0; flex: 1; padding: 18px; overflow: auto; }.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }.form-grid>label { display: grid; gap: 7px; color: rgba(255,255,255,.65); font-size: .8rem; }.wide { grid-column: 1/-1; }textarea { resize: vertical; }
.projects-tab { display: grid; grid-template-columns: 190px 1fr; gap: 18px; }.project-list { display: flex; flex-direction: column; gap: 8px; }.project-list button { display: flex; justify-content: space-between; gap: 8px; text-align: left; }.project-list small { color: rgba(255,255,255,.4); }.project-form { min-width: 0; }
.switches { display: flex!important; align-items: center; gap: 20px!important; }.switches label { display: flex; align-items: center; gap: 7px; }.switches input { width: auto; }.upload-row { display: flex; gap: 8px; }.upload-btn { position: relative; flex: none; display: inline-flex; align-items: center; justify-content: center; padding: 10px 14px; border: 0; border-radius: 8px; color: var(--theme-primary); background: rgba(0,212,255,.12); cursor: pointer; font: inherit; overflow: hidden; }.upload-btn:focus-within { outline: 2px solid var(--theme-primary); outline-offset: 2px; }.upload-btn.disabled { opacity: .5; cursor: not-allowed; }.file-input-overlay { position: absolute; inset: 0; width: 100%; height: 100%; padding: 0; border: 0; opacity: 0; cursor: pointer; }.file-input-overlay:disabled { cursor: not-allowed; }
.details-editor { display: grid; gap: 10px; }.section-title { display: flex; align-items: center; justify-content: space-between; color: rgba(255,255,255,.65); font-size: .8rem; }.detail-row { display: grid; grid-template-columns: 150px 1fr auto; gap: 8px; align-items: start; }.mini-btn,.detail-remove { padding: 7px 10px; border: 1px solid rgba(0,212,255,.25); border-radius: 7px; color: var(--theme-primary); background: rgba(0,212,255,.1); cursor: pointer; }.detail-remove { color: #ff7199; border-color: rgba(255,113,153,.25); background: rgba(255,113,153,.1); }.empty-hint { margin: 0; color: rgba(255,255,255,.4); font-size: .8rem; }
.music-editor { display: grid; gap: 14px; }.music-editor-header { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding-bottom: 4px; }.music-editor-header>div { display: grid; gap: 5px; }.music-editor-header strong { color: rgba(255,255,255,.9); font-size: .92rem; }.music-editor-header p { margin: 0; color: rgba(255,255,255,.48); font-size: .74rem; }.music-upload-btn { align-self: center; white-space: nowrap; }.music-empty { margin: 8px 0 0; padding: 32px 18px; border: 1px dashed rgba(255,255,255,.14); border-radius: 12px; color: rgba(255,255,255,.45); text-align: center; font-size: .8rem; }.music-track-list { display: grid; gap: 12px; }.music-track-card { padding: 14px; border: 1px solid rgba(255,255,255,.1); border-radius: 12px; background: rgba(255,255,255,.025); }.music-track-head { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }.music-track-index { color: var(--theme-primary); font-size: .72rem; font-weight: 750; font-variant-numeric: tabular-nums; }.music-track-state { display: flex; align-items: center; gap: 7px; color: rgba(255,255,255,.65); font-size: .76rem; }.music-track-state input { width: auto; }.music-track-actions { display: flex; gap: 6px; margin-left: auto; }.music-track-actions button { min-width: 30px; height: 30px; padding: 0 8px; border: 1px solid rgba(255,255,255,.12); border-radius: 7px; color: rgba(255,255,255,.7); background: rgba(255,255,255,.06); cursor: pointer; }.music-track-actions button:hover:not(:disabled) { color: var(--theme-primary); border-color: rgba(0,212,255,.35); }.music-track-actions .remove-song { color: #ff7199; border-color: rgba(255,113,153,.22); }.music-track-fields { gap: 10px 12px; }.music-source-field { display: grid; gap: 7px; color: rgba(255,255,255,.65); font-size: .8rem; }.source-input { color: rgba(255,255,255,.48); text-overflow: ellipsis; }
.footer-settings-title { margin-top: 4px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,.08); }.footer-settings-title>div { display: grid; gap: 3px; }.footer-settings-title small { color: rgba(255,255,255,.42); font-size: .7rem; font-weight: 400; }
.contacts-editor { display: grid; gap: 12px; padding-top: 8px; }.contacts-title { padding-bottom: 2px; }.contacts-title>div { display: grid; gap: 3px; }.contacts-title small { color: rgba(255,255,255,.42); font-size: .7rem; font-weight: 400; }.enabled-count { color: rgba(255,255,255,.48); font-size: .7rem; }
.contact-preset-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 10px; }.contact-preset { min-width: 0; padding: 12px; border: 1px solid rgba(255,255,255,.09); border-radius: 12px; background: rgba(255,255,255,.025); transition: border-color .2s ease,background .2s ease,box-shadow .2s ease; }.contact-preset.enabled { border-color: color-mix(in srgb,var(--contact-color) 42%,rgba(255,255,255,.1)); background: linear-gradient(135deg,color-mix(in srgb,var(--contact-color) 10%,transparent),rgba(255,255,255,.025)); box-shadow: inset 0 1px 0 rgba(255,255,255,.035); }.contact-preset-head { display: grid; grid-template-columns: 30px 1fr auto auto; align-items: center; gap: 9px; }.contact-brand-icon { width: 30px; height: 30px; display: grid; place-items: center; border-radius: 9px; color: var(--contact-color); background: color-mix(in srgb,var(--contact-color) 13%,rgba(255,255,255,.04)); }.contact-brand-icon svg { width: 17px; height: 17px; }.contact-brand-name { color: rgba(255,255,255,.86); font-size: .78rem; font-weight: 650; }.contact-order-actions { display: flex; gap: 4px; }.contact-order-actions button { width: 26px; height: 26px; padding: 0; border: 1px solid rgba(255,255,255,.12); border-radius: 7px; color: rgba(255,255,255,.68); background: rgba(255,255,255,.06); cursor: pointer; }.contact-order-actions button:hover:not(:disabled) { color: var(--theme-primary); border-color: color-mix(in srgb,var(--theme-primary) 45%,transparent); background: color-mix(in srgb,var(--theme-primary) 10%,transparent); }.contact-order-actions button:disabled { opacity: .25; cursor: default; }.contact-toggle { width: 36px; height: 20px; padding: 2px; border: 0; border-radius: 99px; background: rgba(255,255,255,.14); cursor: pointer; transition: background .2s ease; }.contact-toggle span { display: block; width: 16px; height: 16px; border-radius: 50%; background: rgba(255,255,255,.72); transition: transform .2s ease,background .2s ease; }.contact-toggle[aria-checked="true"] { background: var(--theme-gradient); }.contact-toggle[aria-checked="true"] span { transform: translateX(16px); background: #fff; }.contact-preset-body { min-height: 40px; display: flex; align-items: center; gap: 9px; margin-top: 11px; }.contact-preset-body>input { height: 38px; font-size: .74rem; }.contact-upload { flex: none; padding: 9px 11px; border-radius: 8px; color: var(--contact-color); background: color-mix(in srgb,var(--contact-color) 12%,transparent); font-size: .72rem; cursor: pointer; }.contact-upload input { display: none; }.contact-empty { color: rgba(255,255,255,.35); font-size: .68rem; }.contact-qr-preview { width: 40px; height: 40px; flex: none; padding: 3px; box-sizing: border-box; object-fit: contain; background: #fff; border-radius: 8px; }
.primary-btn,.secondary-btn,.danger-btn { padding: 9px 18px; border: 0; border-radius: 8px; color: #fff; cursor: pointer; }.primary-btn { background: var(--theme-gradient); }.secondary-btn { margin-right: 8px; background: rgba(255,255,255,.1); }.danger-btn { margin-top: 18px; background: rgba(255,50,100,.24); }button:disabled { opacity: .55; cursor: wait; }.message { min-height: 1em; color: rgba(255,255,255,.6); font-size: .82rem; }.message.error { color: #ff7199; }
.footer-actions { display: flex; align-items: center; gap: 8px; }.footer-actions .secondary-btn { margin-right: 0; }.sync-btn { margin-right: 6px; padding: 9px 13px; border: 1px solid rgba(0,212,255,.28); border-radius: 8px; color: var(--theme-primary); background: rgba(0,212,255,.09); cursor: pointer; }
@media (max-width:700px) { .config-editor-overlay { padding: 8px; }.config-editor { width: 100%; height: 94vh; }.form-grid { grid-template-columns: 1fr; }.wide { grid-column: auto; }.projects-tab { display: block; }.project-list { flex-direction: row; overflow-x: auto; margin-bottom: 16px; }.detail-row { grid-template-columns: 1fr; }.contact-preset-grid { grid-template-columns: 1fr; }.music-editor-header { align-items: flex-start; flex-direction: column; }.music-track-head { flex-wrap: wrap; }.music-track-actions { width: 100%; margin-left: 0; }.editor-footer { align-items: flex-start; flex-direction: column; }.footer-actions { width: 100%; flex-wrap: wrap; }.sync-btn { margin-right: auto; } }
</style>

<template>
  <div class="widget links-widget">
    <div class="widget-header">
      <span class="widget-icon">🚀</span>
      <span class="widget-title">精选作品</span>
      <span class="project-count">{{ store.links.length }} PROJECTS</span>
    </div>

    <div class="links-grid">
      <button
        v-for="project in store.links"
        :key="project.id"
        type="button"
        class="link-card"
        :class="{ featured: project.featured }"
        :style="{ '--link-color': project.color }"
        @click="selected = project"
      >
        <img :src="project.image" :alt="`${project.name} 界面预览`" @error="fallbackImage" />
        <div class="link-overlay"></div>
        <div class="link-copy">
          <span class="link-type">{{ project.eyebrow }}</span>
          <strong>{{ project.name }}</strong>
          <p>{{ project.description }}</p>
          <div class="project-tags"><span v-for="tag in project.stack" :key="tag">{{ tag }}</span></div>
        </div>
        <span v-if="project.featured && typeof project.stars === 'number'" class="star-badge">⭐ {{ project.stars }}</span>
        <span v-else class="open-arrow">↗</span>
      </button>
    </div>

    <Teleport to="body">
      <div v-if="selected" class="project-backdrop" @mousedown.self="selected = null">
        <section class="project-dialog" role="dialog" aria-modal="true" :aria-label="selected.name">
          <button class="dialog-close" type="button" aria-label="关闭项目详情" @click="selected = null">✕</button>
          <div class="dialog-media"><img :src="selected.image" :alt="`${selected.name} 界面预览`" @error="fallbackImage" /></div>
          <div class="dialog-content">
            <span class="dialog-type">{{ selected.eyebrow }}</span>
            <h2>{{ selected.name }}</h2>
            <p class="dialog-lead">{{ selected.longDescription || selected.description }}</p>
            <div v-for="detail in selected.details" :key="detail[0]" class="detail-row"><strong>{{ detail[0] }}</strong><p>{{ detail[1] }}</p></div>
            <div v-if="selected.installCommand" class="install-command"><span>终端安装</span><code>{{ selected.installCommand }}</code></div>
            <div class="dialog-actions">
              <a v-if="selected.previewUrl" :href="selected.previewUrl" target="_blank" rel="noreferrer">在线体验 ↗</a>
              <a :href="selected.githubUrl" target="_blank" rel="noreferrer" class="secondary">查看源码</a>
            </div>
          </div>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { mainStore } from '../../store'

const store = mainStore()
const selected = ref(null)
const closeOnEscape = (event) => { if (event.key === 'Escape') selected.value = null }
const fallbackImage = (event) => {
  event.currentTarget.onerror = null
  event.currentTarget.src = '/assets/project-canvas.png'
}

watch(selected, (project) => document.body.classList.toggle('project-modal-open', Boolean(project)))
onMounted(() => document.addEventListener('keydown', closeOnEscape))
onUnmounted(() => {
  document.removeEventListener('keydown', closeOnEscape)
  document.body.classList.remove('project-modal-open')
})
</script>

<style lang="scss" scoped>
.links-widget { background: rgba(255,255,255,.05); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,.1); border-radius: 16px; padding: 16px; }
.widget-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.widget-icon { font-size: 16px; }
.widget-title { color: var(--theme-primary); font-size: .85rem; font-weight: 600; }
.project-count { margin-left: auto; color: rgba(255,255,255,.36); font-size: .58rem; letter-spacing: .12em; }
.links-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 10px; }
.link-card { position: relative; min-height: 148px; padding: 0; overflow: hidden; border: 1px solid rgba(255,255,255,.11); border-radius: 12px; color: #fff; background: #07101f; text-align: left; cursor: pointer; transition: transform .3s,border-color .3s,box-shadow .3s; }
.link-card.featured { grid-column: 1/-1; min-height: 220px; }
.link-card:hover { transform: translateY(-3px); border-color: var(--link-color); box-shadow: 0 10px 30px color-mix(in srgb,var(--link-color) 22%,transparent); }
.link-card img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .5s; }
.link-card:hover img { transform: scale(1.035); }
.link-overlay { position: absolute; inset: 0; background: linear-gradient(90deg,rgba(3,8,20,.92),rgba(3,8,20,.42) 67%,rgba(3,8,20,.18)); }
.link-copy { position: relative; z-index: 1; width: 78%; padding: 16px; }
.featured .link-copy { width: 54%; padding: 23px; }
.link-type,.dialog-type { color: var(--link-color,var(--theme-primary)); font-size: .58rem; letter-spacing: .13em; text-transform: uppercase; }
.link-copy strong { display: block; margin-top: 5px; font-size: 1rem; }
.featured .link-copy strong { font-size: 1.45rem; }
.link-copy p { margin: 7px 0 12px; color: rgba(255,255,255,.66); font-size: .68rem; line-height: 1.55; }
.project-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.project-tags span { padding: 3px 5px; border: 1px solid rgba(255,255,255,.12); border-radius: 4px; color: rgba(255,255,255,.5); font-size: .5rem; }
.star-badge,.open-arrow { position: absolute; z-index: 2; top: 12px; right: 12px; padding: 5px 8px; border: 1px solid rgba(255,255,255,.16); border-radius: 8px; background: rgba(3,8,20,.64); font-size: .68rem; }
.open-arrow { width: 27px; height: 27px; padding: 0; display: grid; place-items: center; }
@media(max-width:480px){.links-grid{grid-template-columns:1fr}.link-card.featured{grid-column:auto;min-height:190px}.featured .link-copy{width:75%;padding:18px}.link-card{min-height:155px}}
</style>

<style lang="scss">
body.project-modal-open { overflow: hidden; }
.project-backdrop { position: fixed; z-index: 10000; inset: 0; padding: 28px; display: grid; place-items: center; overflow-y: auto; background: rgba(2,5,15,.78); backdrop-filter: blur(12px); }
.project-dialog { position: relative; width: min(1080px,100%); max-height: min(760px,calc(100vh - 56px)); display: grid; grid-template-columns: 1.15fr .85fr; overflow: hidden; border: 1px solid rgba(255,255,255,.18); border-radius: 20px; background: rgba(8,12,30,.97); box-shadow: 0 40px 120px rgba(0,0,0,.62); }
.dialog-close { position: absolute; z-index: 2; top: 15px; right: 15px; width: 38px; height: 38px; border: 1px solid rgba(255,255,255,.18); border-radius: 50%; color: #fff; background: rgba(3,7,20,.72); }
.dialog-media { min-height: 560px; background: #050918; }
.dialog-media img { width: 100%; height: 100%; object-fit: cover; }
.dialog-content { padding: 48px 38px 38px; overflow-y: auto; }
.dialog-type { color: var(--theme-primary); }
.dialog-content h2 { margin: 6px 0 12px; font-size: 2.2rem; }
.dialog-lead { margin: 0 0 22px; color: rgba(255,255,255,.7); font-size: .82rem; line-height: 1.7; }
.detail-row { padding: 13px 0; border-top: 1px solid rgba(255,255,255,.1); }
.detail-row strong { font-size: .72rem; }
.detail-row p { margin: 6px 0 0; color: rgba(255,255,255,.56); font-size: .72rem; line-height: 1.65; }
.install-command { margin-top: 18px; padding: 13px; display: grid; gap: 7px; border: 1px solid rgba(0,212,255,.18); border-radius: 10px; background: rgba(0,212,255,.05); }
.install-command span { color: rgba(255,255,255,.5); font-size: .58rem; }
.install-command code { color: #c9f7ff; font-size: .76rem; }
.dialog-actions { margin-top: 22px; display: flex; gap: 8px; }
.dialog-actions a { padding: 10px 15px; border-radius: 9px; color: #06101a; background: var(--theme-primary); font-size: .72rem; }
.dialog-actions a.secondary { border: 1px solid rgba(255,255,255,.16); color: #fff; background: rgba(255,255,255,.06); }
@media(max-width:720px){.project-backdrop{padding:12px;align-items:end}.project-dialog{max-height:calc(100dvh - 24px);grid-template-columns:1fr;overflow-y:auto}.dialog-media{min-height:0;height:32vh}.dialog-content{padding:28px 20px 24px;overflow:visible}.dialog-content h2{font-size:1.8rem}}
</style>

<template>
  <div class="widget links-widget" :class="{ 'links-widget--desktop': desktop }">
    <div class="widget-header">
      <span class="widget-icon">🚀</span>
      <span class="widget-title">精选作品</span>
      <div class="widget-actions">
        <span class="project-count">
          {{ hasMoreProjects ? `${showcaseProjects.length} / ${allProjects.length}` : `${allProjects.length} PROJECTS` }}
        </span>
        <button
          v-if="hasMoreProjects"
          type="button"
          class="more-projects-button"
          aria-haspopup="dialog"
          aria-controls="works-browser-dialog"
          :aria-expanded="browserOpen"
          @click="openProjectBrowser"
        >
          更多作品 <span aria-hidden="true">↗</span>
        </button>
      </div>
    </div>

    <div class="links-grid">
      <button
        v-for="project in showcaseProjects"
        :key="project.id"
        type="button"
        class="link-card"
        :class="{ featured: project.featured }"
        :style="{ '--link-color': project.color }"
        @click="openProjectDetails(project, $event.currentTarget)"
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
      <Transition name="works-browser" @after-leave="restoreBrowserFocus">
        <div
          v-if="browserOpen"
          id="works-browser-dialog"
          ref="browserDialog"
          class="works-browser-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="works-browser-title"
          :aria-hidden="selected ? 'true' : undefined"
          :inert="Boolean(selected)"
          tabindex="-1"
        >
          <div class="archive-orbit archive-orbit--outer" aria-hidden="true"></div>
          <div class="archive-orbit archive-orbit--inner" aria-hidden="true"></div>
          <div class="works-browser-shell">
            <header class="works-browser-header">
              <div class="archive-heading">
                <span class="archive-kicker"><i></i> ELIN · 作品档案</span>
                <h2 id="works-browser-title">完整作品集</h2>
                <p>从开源工具到日常应用，浏览每一个已经落地的想法。</p>
              </div>
              <button ref="browserClose" type="button" class="browser-close" @click="closeProjectBrowser">
                <span>返回桌面</span><kbd>Esc</kbd>
              </button>
            </header>

            <div class="archive-toolbar">
              <label class="archive-search">
                <span aria-hidden="true">⌕</span>
                <input v-model="projectQuery" type="search" aria-label="搜索作品" placeholder="搜索作品名称或关键词" />
              </label>
              <p>{{ projectQuery ? `找到 ${filteredProjects.length} 个作品` : `共 ${allProjects.length} 个作品，点击卡片查看完整介绍` }}</p>
            </div>

            <div v-if="filteredProjects.length" class="archive-grid">
              <button
                v-for="(project, index) in filteredProjects"
                :key="project.id"
                type="button"
                class="archive-card"
                :class="{ featured: project.featured }"
                :style="{ '--link-color': project.color, '--archive-delay': `${Math.min(index, 8) * 45}ms` }"
                @click="openProjectDetails(project, $event.currentTarget)"
              >
                <img :src="project.image" :alt="`${project.name} 界面预览`" loading="lazy" @error="fallbackImage" />
                <div class="archive-card-shade"></div>
                <span class="archive-index">{{ formatProjectIndex(index) }}</span>
                <div class="archive-card-copy">
                  <span class="archive-type">{{ project.eyebrow }}</span>
                  <strong>{{ project.name }}</strong>
                  <p>{{ project.longDescription || project.description }}</p>
                  <div class="archive-tags"><span v-for="tag in project.stack" :key="tag">{{ tag }}</span></div>
                </div>
                <span class="archive-open">查看详情 <b aria-hidden="true">↗</b></span>
              </button>
            </div>

            <div v-else class="archive-empty">
              <span>✦</span>
              <strong>没有找到相关作品</strong>
              <p>换一个关键词试试</p>
            </div>

            <footer class="archive-footer">
              <span>ELIN · 持续构建中</span>
              <i></i>
              <span>新的作品会继续收录在这里</span>
            </footer>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <div v-if="selected" class="project-backdrop" @mousedown.self="closeProjectDetails">
        <section
          ref="projectDialog"
          class="project-dialog"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="`project-dialog-title-${selected.id}`"
          tabindex="-1"
        >
          <button class="dialog-close" type="button" aria-label="关闭项目详情" @click="closeProjectDetails">✕</button>
          <div class="dialog-media"><img :src="selected.image" :alt="`${selected.name} 界面预览`" @error="fallbackImage" /></div>
          <div class="dialog-content">
            <span class="dialog-type">{{ selected.eyebrow }}</span>
            <h2 :id="`project-dialog-title-${selected.id}`">{{ selected.name }}</h2>
            <p class="dialog-lead">{{ selected.longDescription || selected.description }}</p>
            <div v-for="detail in selected.details" :key="detail[0]" class="detail-row"><strong>{{ detail[0] }}</strong><p>{{ detail[1] }}</p></div>
            <div v-if="selected.installCommand" class="install-command"><span>终端安装</span><code>{{ selected.installCommand }}</code></div>
            <div class="dialog-actions">
              <a v-if="selected.previewUrl" :href="selected.previewUrl" target="_blank" rel="noreferrer">在线体验 ↗</a>
              <a v-if="selected.githubUrl" :href="selected.githubUrl" target="_blank" rel="noreferrer" class="secondary">查看源码</a>
            </div>
          </div>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { mainStore } from '../../store'
import { useWorksBrowser } from '../../composables/works-browser'
import { filterProjects, getShowcaseProjects } from '../../utils/project-browser'

defineProps({ desktop: { type: Boolean, default: false } })

const store = mainStore()
const worksBrowser = useWorksBrowser()
const selected = ref(null)
const browserOpen = worksBrowser.isOpen
const browserClose = ref(null)
const browserDialog = ref(null)
const projectDialog = ref(null)
const projectQuery = ref('')
let projectTrigger = null
const allProjects = computed(() => store.links)
const showcaseProjects = computed(() => getShowcaseProjects(allProjects.value))
const hasMoreProjects = computed(() => allProjects.value.length > showcaseProjects.value.length)
const filteredProjects = computed(() => filterProjects(allProjects.value, projectQuery.value))

const openProjectBrowser = (event) => worksBrowser.open(event.currentTarget)

const openProjectDetails = async (project, trigger) => {
  projectTrigger = trigger
  selected.value = project
  await nextTick()
  projectDialog.value?.querySelector('.dialog-close')?.focus()
}

const closeProjectDetails = async () => {
  selected.value = null
  await nextTick()
  if (projectTrigger?.isConnected) projectTrigger.focus()
  projectTrigger = null
}

const closeProjectBrowser = async () => {
  if (selected.value) await closeProjectDetails()
  worksBrowser.close()
}

const restoreBrowserFocus = () => worksBrowser.restoreFocus()

const closeOnEscape = (event) => {
  if (!selected.value && !browserOpen.value) return

  if (event.key === 'Tab') {
    const dialog = selected.value ? projectDialog.value : browserDialog.value
    if (!dialog) return
    const focusable = [...dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')]
      .filter((element) => element.getClientRects().length > 0)
    if (!focusable.length) {
      event.preventDefault()
      dialog.focus()
      return
    }
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
    return
  }

  if (event.key !== 'Escape') return
  event.preventDefault()
  event.stopImmediatePropagation()
  if (selected.value) {
    closeProjectDetails()
    return
  }
  closeProjectBrowser()
}

const formatProjectIndex = (index) => String(index + 1).padStart(2, '0')
const fallbackImage = (event) => {
  event.currentTarget.onerror = null
  event.currentTarget.src = '/assets/project-canvas.png'
}

const syncDesktopIsolation = () => {
  const app = document.querySelector('.app')
  if (!app) return
  const isolated = Boolean(selected.value || browserOpen.value)
  app.inert = isolated
  if (isolated) app.setAttribute('aria-hidden', 'true')
  else app.removeAttribute('aria-hidden')
}

watch(selected, (project) => {
  document.body.classList.toggle('project-modal-open', Boolean(project))
  syncDesktopIsolation()
})
watch(browserOpen, (open) => {
  document.body.classList.toggle('works-browser-open', open)
  syncDesktopIsolation()
  if (open) {
    projectQuery.value = ''
    nextTick(() => browserClose.value?.focus())
  }
})
onMounted(() => document.addEventListener('keydown', closeOnEscape))
onUnmounted(() => {
  document.removeEventListener('keydown', closeOnEscape)
  document.body.classList.remove('project-modal-open', 'works-browser-open')
  worksBrowser.close()
  const app = document.querySelector('.app')
  app?.removeAttribute('aria-hidden')
  if (app) app.inert = false
})
</script>

<style lang="scss" scoped>
.links-widget { background: rgba(255,255,255,.05); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,.1); border-radius: 16px; padding: 16px; }
.widget-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.widget-icon { font-size: 16px; }
.widget-title { color: var(--theme-primary); font-size: .85rem; font-weight: 600; }
.widget-actions { min-width: 0; margin-left: auto; display: flex; align-items: center; gap: 9px; }
.project-count { color: rgba(255,255,255,.36); font-size: .58rem; letter-spacing: .12em; white-space: nowrap; }
.more-projects-button { height: 28px; padding: 0 10px; display: inline-flex; align-items: center; gap: 5px; border: 1px solid color-mix(in srgb,var(--theme-primary) 35%,transparent); border-radius: 8px; color: rgba(255,255,255,.82); background: color-mix(in srgb,var(--theme-primary) 9%,rgba(3,8,20,.6)); font-size: .62rem; white-space: nowrap; transition: border-color .25s ease,background .25s ease,color .25s ease,transform .25s ease; }
.more-projects-button span { color: var(--theme-primary); font-size: .72rem; }
.more-projects-button:hover,.more-projects-button:focus-visible { border-color: var(--theme-primary); color: #fff; background: color-mix(in srgb,var(--theme-primary) 16%,rgba(3,8,20,.72)); transform: translateY(-1px); }
.more-projects-button:focus-visible { outline: 1px solid var(--theme-primary); outline-offset: 3px; }
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
.links-widget--desktop { height: 100%; min-height: 0; display: flex; flex-direction: column; }
.links-widget--desktop:hover { transform: none; border-color: rgba(255,255,255,.1); box-shadow: none; }
.links-widget--desktop::before { display: none; }
.links-widget--desktop .links-grid { flex: 1; min-height: 0; grid-template-rows: 1.35fr repeat(3,minmax(0,1fr)); }
.links-widget--desktop .link-card { min-height: 0; }
.links-widget--desktop .link-copy { padding: 11px 13px; }
.links-widget--desktop .featured .link-copy { padding: 17px; }
.links-widget--desktop .link-copy p { margin: 5px 0 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.links-widget--desktop .project-tags span:nth-child(n+4) { display: none; }

.works-browser-overlay { position: fixed; z-index: 9000; inset: 0; min-height: 100dvh; overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; color: #fff; background: radial-gradient(circle at 12% 12%,color-mix(in srgb,var(--theme-secondary) 24%,transparent),transparent 30%),radial-gradient(circle at 85% 18%,color-mix(in srgb,var(--theme-primary) 18%,transparent),transparent 28%),radial-gradient(circle at 50% 110%,rgba(17,82,128,.34),transparent 42%),#020713; }
.works-browser-overlay::before { content: ''; position: fixed; inset: 0; pointer-events: none; opacity: .34; background-image: radial-gradient(circle,rgba(255,255,255,.88) 0 1px,transparent 1.4px),radial-gradient(circle,rgba(126,220,255,.7) 0 1px,transparent 1.4px); background-position: 0 0,37px 51px; background-size: 86px 86px,131px 131px; mask-image: linear-gradient(to bottom,#000,transparent 88%); }
.works-browser-overlay::after { content: ''; position: fixed; z-index: 0; inset: 0; pointer-events: none; background: linear-gradient(180deg,rgba(255,255,255,.025),transparent 22%),linear-gradient(90deg,transparent 49.9%,rgba(255,255,255,.025) 50%,transparent 50.1%); }
.archive-orbit { position: fixed; z-index: 0; pointer-events: none; border: 1px solid color-mix(in srgb,var(--theme-primary) 18%,transparent); border-radius: 50%; transform: rotate(-18deg); }
.archive-orbit::before { content: ''; position: absolute; width: 7px; height: 7px; border-radius: 50%; background: var(--theme-primary); box-shadow: 0 0 18px var(--theme-primary); }
.archive-orbit--outer { width: 760px; height: 300px; top: -100px; right: -260px; }
.archive-orbit--outer::before { left: 21%; bottom: 8%; }
.archive-orbit--inner { width: 420px; height: 160px; left: -170px; bottom: 6%; opacity: .65; }
.archive-orbit--inner::before { right: 12%; top: 18%; }
.works-browser-shell { position: relative; z-index: 1; width: min(1480px,100%); min-height: 100%; margin: 0 auto; padding: 40px 44px 30px; }
.works-browser-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 32px; padding-bottom: 28px; border-bottom: 1px solid rgba(255,255,255,.1); }
.archive-heading { max-width: 780px; }
.archive-kicker { display: inline-flex; align-items: center; gap: 9px; color: color-mix(in srgb,var(--theme-primary) 82%,#fff); font-size: .68rem; font-weight: 700; letter-spacing: .2em; }
.archive-kicker i { width: 34px; height: 1px; background: var(--theme-primary); box-shadow: 0 0 10px var(--theme-primary); }
.archive-heading h2 { margin: 12px 0 9px; font-size: clamp(2.4rem,5vw,5.4rem); font-weight: 760; line-height: .95; letter-spacing: -.055em; text-shadow: 0 8px 38px rgba(0,0,0,.36); }
.archive-heading p { margin: 0; color: rgba(255,255,255,.55); font-size: .86rem; line-height: 1.7; }
.browser-close { height: 42px; flex: none; padding: 0 9px 0 16px; display: inline-flex; align-items: center; gap: 12px; border: 1px solid rgba(255,255,255,.17); border-radius: 11px; color: rgba(255,255,255,.78); background: rgba(255,255,255,.055); backdrop-filter: blur(14px); transition: border-color .2s ease,background .2s ease,color .2s ease; }
.browser-close kbd { min-width: 38px; padding: 5px 7px; border: 1px solid rgba(255,255,255,.14); border-radius: 7px; color: rgba(255,255,255,.5); background: rgba(0,0,0,.24); font: 500 .62rem/1 inherit; }
.browser-close:hover,.browser-close:focus-visible { border-color: var(--theme-primary); color: #fff; background: color-mix(in srgb,var(--theme-primary) 12%,rgba(255,255,255,.05)); }
.browser-close:focus-visible { outline: 1px solid var(--theme-primary); outline-offset: 4px; }
.archive-toolbar { margin: 24px 0 20px; display: flex; align-items: center; justify-content: space-between; gap: 22px; }
.archive-search { width: min(460px,100%); height: 46px; display: flex; align-items: center; gap: 10px; padding: 0 15px; border: 1px solid rgba(255,255,255,.13); border-radius: 12px; background: rgba(255,255,255,.045); backdrop-filter: blur(16px); transition: border-color .2s ease,box-shadow .2s ease; }
.archive-search:focus-within { border-color: color-mix(in srgb,var(--theme-primary) 65%,transparent); box-shadow: 0 0 0 3px color-mix(in srgb,var(--theme-primary) 10%,transparent); }
.archive-search > span { color: var(--theme-primary); font-size: 1.25rem; }
.archive-search input { width: 100%; border: 0; color: #fff; background: transparent; font-size: .78rem; }
.archive-search input::placeholder { color: rgba(255,255,255,.34); }
.archive-search input::-webkit-search-cancel-button { filter: invert(1); opacity: .5; }
.archive-toolbar p { margin: 0; color: rgba(255,255,255,.42); font-size: .7rem; text-align: right; }
.archive-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); grid-auto-flow: dense; gap: 16px; }
.archive-card { min-height: 250px; position: relative; display: flex; align-items: flex-end; overflow: hidden; padding: 0; border: 1px solid rgba(255,255,255,.12); border-radius: 18px; color: #fff; background: #07101f; text-align: left; box-shadow: 0 16px 42px rgba(0,0,0,.22); animation: archive-card-in .48s cubic-bezier(.2,.75,.2,1) both; animation-delay: var(--archive-delay); transition: transform .3s ease,border-color .3s ease,box-shadow .3s ease; }
.archive-card.featured { grid-column: span 2; min-height: 330px; }
.archive-card > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .7s cubic-bezier(.2,.75,.2,1),filter .4s ease; }
.archive-card-shade { position: absolute; inset: 0; background: linear-gradient(180deg,rgba(1,5,13,.08) 0%,rgba(2,7,18,.28) 34%,rgba(2,7,18,.96) 100%); transition: background .3s ease; }
.archive-card::after { content: ''; position: absolute; inset: auto 0 0; height: 2px; background: linear-gradient(90deg,transparent,var(--link-color),transparent); opacity: .55; transform: scaleX(.22); transition: transform .4s ease,opacity .4s ease; }
.archive-card:hover,.archive-card:focus-visible { transform: translateY(-5px); border-color: color-mix(in srgb,var(--link-color) 62%,transparent); box-shadow: 0 22px 58px rgba(0,0,0,.35),0 0 28px color-mix(in srgb,var(--link-color) 14%,transparent); }
.archive-card:hover > img,.archive-card:focus-visible > img { transform: scale(1.045); filter: saturate(1.08); }
.archive-card:hover::after,.archive-card:focus-visible::after { opacity: 1; transform: scaleX(1); }
.archive-card:focus-visible { outline: 1px solid var(--link-color); outline-offset: 4px; }
.archive-index { position: absolute; z-index: 2; top: 16px; left: 17px; color: rgba(255,255,255,.55); font-size: .62rem; font-variant-numeric: tabular-nums; letter-spacing: .18em; }
.archive-card-copy { position: relative; z-index: 2; width: min(86%,620px); padding: 22px; }
.archive-type { color: var(--link-color); font-size: .58rem; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; }
.archive-card-copy strong { display: block; margin-top: 7px; font-size: 1.25rem; letter-spacing: -.015em; }
.archive-card.featured .archive-card-copy strong { font-size: clamp(1.6rem,2.4vw,2.25rem); }
.archive-card-copy p { margin: 8px 0 14px; display: -webkit-box; overflow: hidden; color: rgba(255,255,255,.61); font-size: .72rem; line-height: 1.65; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.archive-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.archive-tags span { padding: 4px 7px; border: 1px solid rgba(255,255,255,.12); border-radius: 6px; color: rgba(255,255,255,.58); background: rgba(1,5,13,.22); font-size: .54rem; }
.archive-open { position: absolute; z-index: 2; right: 17px; bottom: 19px; display: inline-flex; align-items: center; gap: 6px; color: rgba(255,255,255,.66); font-size: .62rem; }
.archive-open b { color: var(--link-color); font-size: .82rem; }
.archive-empty { min-height: 360px; display: grid; place-items: center; align-content: center; gap: 8px; border: 1px dashed rgba(255,255,255,.15); border-radius: 20px; color: rgba(255,255,255,.45); background: rgba(255,255,255,.025); }
.archive-empty > span { color: var(--theme-primary); font-size: 2rem; }
.archive-empty strong { color: rgba(255,255,255,.78); font-size: 1rem; }
.archive-empty p { margin: 0; font-size: .72rem; }
.archive-footer { min-height: 82px; display: flex; align-items: center; justify-content: center; gap: 16px; color: rgba(255,255,255,.32); font-size: .62rem; letter-spacing: .08em; }
.archive-footer i { width: 42px; height: 1px; background: linear-gradient(90deg,transparent,var(--theme-primary),transparent); }
.works-browser-leave-active { transition: opacity .22s ease; }
.works-browser-enter-active .works-browser-shell,.works-browser-leave-active .works-browser-shell { transition: transform .32s cubic-bezier(.2,.75,.2,1),opacity .25s ease; }
.works-browser-leave-to { opacity: 0; }
.works-browser-enter-from .works-browser-shell,.works-browser-leave-to .works-browser-shell { opacity: 0; transform: translateY(18px); }
@keyframes archive-card-in { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }

@media(max-width:960px){.works-browser-shell{padding:30px 24px 26px}.archive-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.archive-card.featured{grid-column:span 2}.archive-heading h2{font-size:clamp(2.4rem,8vw,4.6rem)}}
@media(max-width:640px){.widget-actions{gap:6px}.project-count{display:none}.more-projects-button{height:36px;padding:0 10px}.works-browser-shell{padding:22px 15px 20px}.works-browser-header{align-items:flex-start;gap:18px;padding-right:58px}.archive-heading h2{margin-top:9px;font-size:2.65rem}.archive-heading p{max-width:250px;font-size:.72rem}.browser-close{position:fixed;z-index:12;top:max(16px,env(safe-area-inset-top));right:15px;width:44px;height:44px;padding:0;justify-content:center}.browser-close span{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}.browser-close::before{content:'✕';font-size:1rem}.browser-close kbd{display:none}.archive-toolbar{align-items:stretch;flex-direction:column;gap:8px}.archive-toolbar p{text-align:left}.archive-search{width:100%}.archive-grid{grid-template-columns:1fr}.archive-card,.archive-card.featured{grid-column:auto;min-height:260px}.archive-card-copy,.archive-card.featured .archive-card-copy{width:88%;padding:18px}.archive-card.featured .archive-card-copy strong{font-size:1.45rem}.archive-open{right:15px;bottom:16px}.archive-footer{flex-wrap:wrap;gap:8px;text-align:center}.archive-footer i{width:24px}}
@media(max-width:480px){.links-grid{grid-template-columns:1fr}.link-card.featured{grid-column:auto;min-height:190px}.featured .link-copy{width:75%;padding:18px}.link-card{min-height:155px}}
@media(max-width:900px){.links-widget--desktop{height:auto}.links-widget--desktop .links-grid{grid-template-rows:none}.links-widget--desktop .link-card{min-height:148px}.links-widget--desktop .link-card.featured{min-height:220px}}
@media(prefers-reduced-motion:reduce){.archive-card{animation:none}.archive-card,.archive-card>img,.works-browser-leave-active,.works-browser-enter-active .works-browser-shell,.works-browser-leave-active .works-browser-shell{transition:none}}
</style>

<style lang="scss">
body.project-modal-open,body.works-browser-open { overflow: hidden; }
body.works-browser-open .app { visibility: hidden; }
body.works-browser-open .works-browser-overlay,body.works-browser-open .project-backdrop { visibility: visible; }
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

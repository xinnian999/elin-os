import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  filterProjects,
  getShowcaseProjects,
  SHOWCASE_PROJECT_LIMIT,
} from '../src/perfect-home/utils/project-browser.js'
import { createWorksBrowserController } from '../src/perfect-home/composables/works-browser.js'

const root = fileURLToPath(new URL('..', import.meta.url))
const projects = Array.from({ length: 9 }, (_, index) => ({
  id: `project-${index + 1}`,
  name: index === 0 ? 'Vue Form Craft' : `作品 ${index + 1}`,
  eyebrow: index === 1 ? 'AI 应用' : '在线工具',
  description: index === 2 ? '自然语言构建应用' : `项目简介 ${index + 1}`,
  longDescription: index === 3 ? '完整的图片编辑体验' : '',
  stack: index === 4 ? ['Cloudflare', 'Vue 3'] : ['React'],
  details: index === 5 ? [['项目亮点', '支持一键导出']] : [],
  featured: index === 0,
}))

test('keeps the showcase at seven projects without mutating the source list', () => {
  assert.equal(SHOWCASE_PROJECT_LIMIT, 7)
  const result = getShowcaseProjects(projects)
  assert.deepEqual(result.map(({ id }) => id), projects.slice(0, 7).map(({ id }) => id))
  assert.equal(result[0], projects[0])
  assert.equal(projects.length, 9)
})

test('keeps short project lists intact and handles invalid limits safely', () => {
  assert.deepEqual(getShowcaseProjects(projects.slice(0, 3)), projects.slice(0, 3))
  assert.deepEqual(getShowcaseProjects([], 7), [])
  assert.deepEqual(getShowcaseProjects(null), [])
  assert.deepEqual(getShowcaseProjects(projects, 0), [])
  assert.deepEqual(getShowcaseProjects(projects, -2), [])
})

test('searches project names, types, descriptions, details, and stacks', () => {
  assert.equal(filterProjects(projects, 'vue form').length, 1)
  assert.equal(filterProjects(projects, 'AI 应用')[0].id, 'project-2')
  assert.equal(filterProjects(projects, '自然语言')[0].id, 'project-3')
  assert.equal(filterProjects(projects, '图片编辑')[0].id, 'project-4')
  assert.equal(filterProjects(projects, 'cloudflare')[0].id, 'project-5')
  assert.equal(filterProjects(projects, '一键导出')[0].id, 'project-6')
  assert.deepEqual(filterProjects(projects, '   '), projects)
  assert.deepEqual(filterProjects(projects, '不存在'), [])
  assert.doesNotThrow(() => filterProjects([{ id: 'empty' }], 'anything'))
})

test('shares one works browser state and restores the actual opener focus', () => {
  const controller = createWorksBrowserController()
  let focused = false
  const opener = { isConnected: true, focus: () => { focused = true } }

  controller.open(opener)
  assert.equal(controller.isOpen.value, true)
  controller.close()
  assert.equal(controller.isOpen.value, false)
  controller.restoreFocus()
  assert.equal(focused, true)

  focused = false
  controller.open({ ...opener, isConnected: false })
  controller.close()
  controller.restoreFocus()
  assert.equal(focused, false)
})

test('wires the full project browser into the existing desktop interaction model', async () => {
  const [widgetSource, mainLeftSource, appSource, mainRightSource, agentDecisions] = await Promise.all([
    readFile(`${root}/src/perfect-home/components/widgets/LinksWidget.vue`, 'utf8'),
    readFile(`${root}/src/perfect-home/views/MainLeft.vue`, 'utf8'),
    readFile(`${root}/src/perfect-home/App.vue`, 'utf8'),
    readFile(`${root}/src/perfect-home/views/MainRight.vue`, 'utf8'),
    readFile(`${root}/AGENTS.md`, 'utf8'),
  ])

  assert.match(widgetSource, /v-for="project in showcaseProjects"/)
  assert.match(widgetSource, /更多作品/)
  assert.match(mainLeftSource, /class="profile-works-button"/)
  assert.match(mainLeftSource, />作品集</)
  assert.match(mainLeftSource, /worksBrowser\.open\(event\.currentTarget\)/)
  assert.match(mainLeftSource, /aria-controls="works-browser-dialog"/)
  assert.match(appSource, /provide\(worksBrowserKey, worksBrowser\)/)
  assert.match(widgetSource, /class="works-browser-overlay"/)
  assert.match(widgetSource, /aria-modal="true"/)
  assert.match(widgetSource, /:inert="Boolean\(selected\)"/)
  assert.match(widgetSource, /app\.inert = isolated/)
  assert.match(widgetSource, /if \(selected\.value\)[\s\S]+closeProjectDetails\(\)[\s\S]+closeProjectBrowser\(\)/)
  assert.match(mainRightSource, /\.works-browser-overlay/)
  assert.match(agentDecisions, /主页最多展示 7 个项目/)
})

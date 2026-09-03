import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { moveArrayItem } from '../src/perfect-home/utils/reorder.js'

const root = fileURLToPath(new URL('..', import.meta.url))

test('moves a project to the requested position without replacing its object', () => {
  const projects = [{ id: 'one' }, { id: 'two' }, { id: 'three' }]
  const selected = projects[0]

  assert.equal(moveArrayItem(projects, 0, 2), true)
  assert.deepEqual(projects.map(({ id }) => id), ['two', 'three', 'one'])
  assert.equal(projects[2], selected)
})

test('ignores invalid or unchanged reorder requests', () => {
  const projects = [{ id: 'one' }, { id: 'two' }]

  assert.equal(moveArrayItem(projects, 0, 0), false)
  assert.equal(moveArrayItem(projects, -1, 1), false)
  assert.equal(moveArrayItem(projects, 0, 2), false)
  assert.deepEqual(projects.map(({ id }) => id), ['one', 'two'])
})

test('wires pointer and keyboard sorting into the works editor', async () => {
  const [source, configSource] = await Promise.all([
    readFile(`${root}/src/perfect-home/components/ConfigEditor.vue`, 'utf8'),
    readFile(`${root}/src/perfect-home/utils/config.js`, 'utf8'),
  ])

  assert.match(source, /@pointerdown="startProjectDrag\(\$event, index\)"/)
  assert.match(source, /@keydown\.up\.prevent="moveProject\(index, -1\)"/)
  assert.match(source, /@keydown\.down\.prevent="moveProject\(index, 1\)"/)
  assert.match(source, /作品顺序已调整，保存后生效/)
  assert.match(source, /JSON\.stringify\(\{ projects: draft\.projects \}\)/)
  assert.match(configSource, /v2\.3\.10[\s\S]+作品支持拖拽调整展示顺序/)
})

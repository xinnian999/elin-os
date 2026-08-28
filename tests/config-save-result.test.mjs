import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { createServer } from 'vite'

const root = fileURLToPath(new URL('..', import.meta.url))

test('uses confirmed save responses to update contacts without reloading public APIs', async (t) => {
  const vite = await createServer({ root, logLevel: 'silent', server: { middlewareMode: true } })
  t.after(() => vite.close())

  const { makeConfigFromSaveResults } = await vite.ssrLoadModule('/src/perfect-home/utils/config.js')
  const config = makeConfigFromSaveResults(
    {
      profile: {
        name: 'Elin',
        role: 'Developer',
        intro: 'Building things',
        location: 'Remote',
        githubUrl: '',
        contacts: [{ id: 'phone', name: '手机', type: 'link', value: 'tel:13800000000', icon: 'phone', color: '#34C759' }],
      },
    },
    { projects: [] },
    {
      home: {
        site: { avatar: 'E', startDate: '2026-08-20', typewriterLines: [], countdownName: '倒计时', countdownDate: '2027-01-01' },
        announcement: { enabled: false, text: '', speed: 50, textColor: '#fff', backgroundColor: '#000' },
      },
    },
  )

  assert.deepEqual(config.socials, [
    { id: 'phone', name: '手机', type: 'link', value: 'tel:13800000000', icon: 'phone', color: '#34C759', url: 'tel:13800000000' },
  ])
})

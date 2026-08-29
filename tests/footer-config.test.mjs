import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { createServer } from 'vite'

const root = fileURLToPath(new URL('..', import.meta.url))
const baseHome = {
  site: {
    avatar: 'E',
    startDate: '2026-08-20',
    typewriterLines: ['保持好奇'],
    countdownName: '倒计时',
    countdownDate: '2027-01-01',
  },
  announcement: {
    enabled: true,
    text: '公告',
    speed: 48,
    backgroundColor: '#000',
    textColor: '#fff',
  },
}

const defaultFooter = {
  filingText: '冀ICP备2025100393号-1',
  filingUrl: 'https://beian.miit.gov.cn/',
  copyrightText: 'Copyright © {year} Elin',
  uiCreditText: '界面设计参考 Perfect Home',
  uiCreditUrl: 'https://github.com/327261086/perfect-home',
}

test('normalizes and maps configurable footer metadata', async (t) => {
  const vite = await createServer({ root, logLevel: 'silent', server: { middlewareMode: true } })
  t.after(() => vite.close())
  const [{ normalizeHome }, { makeConfig }] = await Promise.all([
    vite.ssrLoadModule('/worker/schema.ts'),
    vite.ssrLoadModule('/src/perfect-home/utils/config.js'),
  ])

  await t.test('fills defaults for legacy home data without footer metadata', () => {
    assert.deepEqual(normalizeHome(baseHome).footer, defaultFooter)
  })

  await t.test('replaces the old interface credit wording', () => {
    assert.equal(normalizeHome({
      ...baseHome,
      footer: { ...defaultFooter, uiCreditText: 'UI based on elin-os' },
    }).footer.uiCreditText, '界面设计：elin-os')
  })

  await t.test('preserves normalized custom values and explicitly empty values', () => {
    const customHome = normalizeHome({
      ...baseHome,
      footer: {
        filingText: '  京ICP备12345678号-1  ',
        filingUrl: 'https://example.com/filing',
        copyrightText: '  Copyright © {year} Example  ',
        uiCreditText: '  Design by Example  ',
        uiCreditUrl: 'https://example.com/design',
      },
    })
    assert.deepEqual(customHome.footer, {
      filingText: '京ICP备12345678号-1',
      filingUrl: 'https://example.com/filing',
      copyrightText: 'Copyright © {year} Example',
      uiCreditText: 'Design by Example',
      uiCreditUrl: 'https://example.com/design',
    })

    const emptyFooter = normalizeHome({
      ...baseHome,
      footer: {
        filingText: '',
        filingUrl: '',
        copyrightText: '',
        uiCreditText: '',
        uiCreditUrl: '',
      },
    }).footer
    assert.deepEqual(emptyFooter, {
      filingText: '',
      filingUrl: '',
      copyrightText: '',
      uiCreditText: '',
      uiCreditUrl: '',
    })
  })

  await t.test('allows empty links and rejects unsafe footer links', () => {
    assert.doesNotThrow(() => normalizeHome({
      ...baseHome,
      footer: { ...defaultFooter, filingUrl: '', uiCreditUrl: '' },
    }))
    assert.throws(
      () => normalizeHome({
        ...baseHome,
        footer: { ...defaultFooter, filingUrl: 'http://beian.example.com' },
      }),
      /安全链接/,
    )
    assert.throws(
      () => normalizeHome({
        ...baseHome,
        footer: { ...defaultFooter, uiCreditUrl: 'javascript:alert(1)' },
      }),
      /安全链接/,
    )
  })

  await t.test('passes normalized home footer metadata into the runtime config', () => {
    const home = normalizeHome({
      ...baseHome,
      footer: {
        filingText: '京ICP备12345678号-1',
        filingUrl: 'https://example.com/filing',
        copyrightText: 'Copyright © {year} Example',
        uiCreditText: 'Design by Example',
        uiCreditUrl: 'https://example.com/design',
      },
    })
    const config = makeConfig({ name: 'Elin', contacts: [] }, [], home)
    assert.deepEqual(config.footer, home.footer)
  })
})

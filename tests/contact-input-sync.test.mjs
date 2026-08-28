import assert from 'node:assert/strict'
import test from 'node:test'

import { syncContactInputValues } from '../src/perfect-home/utils/contact-presets.js'

test('syncs the latest contact DOM values before saving', () => {
  const contacts = [
    { id: 'github', value: 'https://github.com/old' },
    { id: 'email', value: 'old@example.com' },
  ]
  const inputs = [
    { dataset: { contactId: 'github' }, value: 'https://github.com/new' },
    { dataset: { contactId: 'email' }, value: 'new@example.com' },
  ]

  syncContactInputValues(contacts, inputs)

  assert.deepEqual(contacts, [
    { id: 'github', value: 'https://github.com/new' },
    { id: 'email', value: 'new@example.com' },
  ])
})

test('ignores stale or unrelated template refs', () => {
  const contacts = [{ id: 'github', value: 'unchanged' }]

  syncContactInputValues(contacts, [
    null,
    { dataset: { contactId: 'missing' }, value: 'ignored' },
    { dataset: { contactId: 'github' }, value: null },
  ])

  assert.equal(contacts[0].value, 'unchanged')
})

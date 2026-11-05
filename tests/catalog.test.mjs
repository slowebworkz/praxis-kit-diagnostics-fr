import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkCatalog, createMessageResolver } from 'praxis-kit-diagnostics'
import contract from 'praxis-kit-diagnostics/contract'
import en from 'praxis-kit-diagnostics/en'
import fr from '../index.js'

// An English-only fingerprint: a handful of function words that should never survive translation.
const ENGLISH = /\b(?:the|should|already|is not|Expected|Allowed|requires|and|or)\b/

test('the catalog is structurally valid and complete against the contract', () => {
  const report = checkCatalog(fr, contract)
  assert.deepEqual(report.errors, [])
  assert.deepEqual(report.warnings, [])
  assert.deepEqual(report.obsolete, [])
  assert.deepEqual(report.incomplete, [])
  assert.equal(report.coverage.translated, report.coverage.total)
  assert.equal(report.coverage.ratio, 1)
})

test('it targets the contract major this package supports', () => {
  assert.equal(fr.contract, contract.contract)
  assert.equal(fr.locale, 'fr')
})

test('every contract example renders in French with nothing left over', () => {
  const resolve = createMessageResolver(fr)
  const english = createMessageResolver(en)
  let rendered = 0
  for (const [id, spec] of Object.entries(contract.ids)) {
    if (spec.removedIn) continue
    for (const example of spec.examples) {
      const text = resolve(example)
      assert.ok(text, `${id}: no French text for ${JSON.stringify(example)}`)
      for (const part of [text.message, text.rationale, ...(text.suggestions ?? []).flatMap((s) => [s.title, s.description])]) {
        if (part === undefined) continue
        assert.doesNotMatch(part, /\{[A-Za-z_$][\w$]*(?:\|[a-z-]+)*\}/, `${id}: unfilled placeholder in "${part}"`)
        assert.doesNotMatch(part, /\[object Object\]/, `${id}: bad value in "${part}"`)
        // An example's own value may be the word "undefined" (an attribute whose value was undefined);
        // that is fine when English shows it too. A value that only French shows is a bug.
        if (/\bundefined\b/.test(part)) {
          assert.match(english(example).message, /\bundefined\b/, `${id}: "undefined" leaked into "${part}"`)
        }
      }
      rendered++
    }
  }
  assert.ok(rendered >= Object.keys(contract.ids).length, 'every id has at least one example')
})

test('messages are French, not English', () => {
  const resolve = createMessageResolver(fr)
  const leaked = []
  for (const [id, spec] of Object.entries(contract.ids)) {
    for (const example of spec.examples.slice(0, 1)) {
      const message = resolve(example)?.message ?? ''
      // Strip code-like text (tags, quoted values) before looking for English words.
      const prose = message.replace(/<[^>]*>|"[^"]*"|«[^»]*»|\[[^\]]*\]/g, ' ')
      if (ENGLISH.test(prose)) leaked.push(`${id}: ${message}`)
    }
  }
  assert.deepEqual(leaked, [])
})

test('plural forms follow French rules (0 and 1 are "one")', () => {
  const resolve = createMessageResolver(fr)
  const message = (count) =>
    resolve({ code: 'SLOT1003', context: { name: 'Button', count, elementTerm: 'élément React' } }).message
  assert.match(message(0), /écarté 0 enfant qui/)
  assert.match(message(1), /écarté 1 enfant qui/)
  assert.match(message(2), /écarté 2 enfants qui/)
})

test('lists use French conjunctions', () => {
  const resolve = createMessageResolver(fr)
  const text = resolve({
    code: 'HTML3007',
    context: { child: 'div', parent: 'ul', allowed: ['<li>', '<script>', '<template>'] },
  }).message
  assert.match(text, /<li>, <script> ou <template>/)
})

test('an incomplete pack still works with an opt-in English fallback, and prints the code without', () => {
  const partial = { contract: 1, locale: 'fr', messages: { HTML3003: fr.messages.HTML3003 } }
  const fact = { code: 'HTML3004', context: { tag: 'nav', implicitRole: 'navigation', role: 'region' } }
  assert.equal(createMessageResolver(partial)(fact), undefined)
  assert.match(createMessageResolver(partial, { fallback: en })(fact).message, /should not override/)
  assert.match(createMessageResolver(partial, { fallback: en })({ ...fact, code: 'HTML3003' }).message, /rôle implicite/)
})

test('a pack for another contract major is ignored and reported, never thrown', () => {
  const issues = []
  const future = { ...fr, contract: 2 }
  const resolve = createMessageResolver(future, { fallback: en, onIssue: (issue) => issues.push(issue) })
  assert.match(resolve({ code: 'HTML3003', context: { tag: 'nav', implicitRole: 'navigation' } }).message, /already has/)
  assert.ok(issues.length > 0)
})

test('the validator rejects damage to the catalog', () => {
  const damage = (edit) => {
    const copy = structuredClone(fr)
    edit(copy)
    return checkCatalog(copy, contract).errors.map((e) => e.kind)
  }
  assert.ok(damage((c) => (c.messages.HTML3003.message = '<{tag}> a déjà un rôle.')).includes('placeholder-missing-essential'))
  assert.ok(damage((c) => (c.messages.HTML3003.message = '<{nope}> {tag} {implicitRole}')).includes('unknown-context-key'))
  assert.ok(damage((c) => (c.messages.TYPO999 = { message: 'x' })).includes('unknown-id'))
  assert.ok(damage((c) => (c.messages.HTML3003.message = '  ')).includes('empty-message'))
  assert.ok(damage((c) => (c.contract = 2)).includes('contract-incompatible'))
})

test('the catalog file is UTF-8, writes invisible characters as escapes, and has no mojibake', async () => {
  const { readFile } = await import('node:fs/promises')
  const bytes = await readFile(new URL('../catalog/fr.json', import.meta.url))
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes) // throws on invalid UTF-8
  assert.ok(!text.includes('﻿'), 'no byte order mark')
  assert.ok(!/[  ​]/.test(text), 'invisible spaces must be written as \\uXXXX escapes')
  assert.ok(!/Ã[\u0080-¿]|â\u0080|�/.test(text), 'looks like mojibake or a replacement character')
  assert.match(text, /\\u00a0/, 'French quotes use a non-breaking space')
  assert.ok(text.includes('é') && text.includes('’'), 'accented letters and the typographic apostrophe are literal')
})

test('French quotes keep a non-breaking space inside « »', () => {
  const resolve = createMessageResolver(fr)
  const message = resolve({ code: 'COMP1006', context: { scope: 'Menu', ruleName: 'Item', min: 1 } }).message
  assert.equal(message, 'Menu : « Item » exige au moins 1.')
})

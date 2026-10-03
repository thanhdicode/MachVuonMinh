import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { OUT, ROOT } from '../scripts/owl-guide-qa/app.mjs'
import { resolveChromeExecutable, toImportSpecifier } from '../scripts/owl-guide-qa/browser.mjs'
import { collectCoverage, discoverResultFiles, resultTag } from '../scripts/owl-guide-qa/coverage.mjs'

test('QA paths stay inside the repository on Windows', () => {
  assert.equal(OUT, join(ROOT, '.studio', 'qa', 'owl-guide'))
})

test('absolute Windows module paths become valid file URL import specifiers', () => {
  const specifier = toImportSpecifier('C:\\qa tools\\node_modules\\puppeteer-core\\index.js')
  assert.match(specifier, /^file:\/\/\/C:\/qa%20tools\/node_modules\/puppeteer-core\/index\.js$/i)
})

test('Chrome path override wins when it points to an executable file', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'owl-guide-chrome-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const executable = join(dir, 'chrome.exe')
  writeFileSync(executable, '')
  assert.equal(resolveChromeExecutable({ ...process.env, CHROME_PATH: executable }), executable)
})

test('coverage discovery and tags use platform path semantics', (t) => {
  const qa = mkdtempSync(join(tmpdir(), 'owl-guide-coverage-'))
  t.after(() => rmSync(qa, { recursive: true, force: true }))
  const runDir = join(qa, 'responsive', 'history-1366x768')
  mkdirSync(runDir, { recursive: true })
  writeFileSync(join(runDir, 'result.json'), '{"results":[]}')
  const files = discoverResultFiles(qa)
  assert.deepEqual(files, [join(runDir, 'result.json')])
  assert.equal(resultTag(qa, files[0]), 'responsive/history-1366x768')
})

test('coverage collector reads every responsive result instead of one stale run', (t) => {
  const qa = mkdtempSync(join(tmpdir(), 'owl-guide-collector-'))
  t.after(() => rmSync(qa, { recursive: true, force: true }))
  for (const [tag, moduleId, id] of [['intro-360x640-touch', 'intro', 'I03'], ['history-1366x768', 'history', 'H01']]) {
    const dir = join(qa, 'responsive', tag)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'result.json'), JSON.stringify({ moduleId, results: [{ id }] }))
  }
  const baseline = join(qa, 'responsive', 'policy-before-mobile')
  mkdirSync(baseline, { recursive: true })
  writeFileSync(join(baseline, 'result.json'), JSON.stringify({ moduleId: 'policy', results: [{ id: 'P01' }] }))
  const coverage = collectCoverage(qa)
  assert.equal(coverage.runs.length, 2)
  assert.deepEqual(coverage.reached.filter((id) => id === 'I03' || id === 'H01'), ['I03', 'H01'])
})

test('release coverage excludes historical and reloaded browser runs', (t) => {
  const qa = mkdtempSync(join(tmpdir(), 'owl-guide-release-'))
  t.after(() => rmSync(qa, { recursive: true, force: true }))
  for (const [tag, id, reloaded] of [['old-mobile', 'I03', false], ['release-intro', 'I04', false], ['release-reloaded', 'H01', true]]) {
    const dir = join(qa, 'responsive', tag)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'result.json'), JSON.stringify({ moduleId: id.startsWith('H') ? 'history' : 'intro', reloaded, results: [{ id }] }))
  }
  const coverage = collectCoverage(qa, { prefix: 'release-' })
  assert.equal(coverage.runs.length, 1)
  assert.deepEqual(coverage.reached, ['I04'])
})

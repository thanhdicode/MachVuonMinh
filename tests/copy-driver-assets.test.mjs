import test from 'node:test'
import assert from 'node:assert/strict'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { DRIVER_VERSION, copyDriverAssets } from '../scripts/copy-driver-assets.mjs'

const fixture = ({ version = DRIVER_VERSION, pinned = DRIVER_VERSION, license = 'The MIT License\n\nPermission is hereby granted, free of charge', omit = null } = {}) => {
  const root = mkdtempSync(path.join(tmpdir(), 'driver-assets-'))
  mkdirSync(path.join(root, 'node_modules/driver.js/dist'), { recursive: true })
  writeFileSync(path.join(root, 'package.json'), JSON.stringify({ dependencies: { 'driver.js': pinned } }))
  writeFileSync(path.join(root, 'node_modules/driver.js/package.json'), JSON.stringify({ version, license: 'MIT' }))
  const files = { 'dist/driver.js.iife.js': 'window.driver={}', 'dist/driver.css': '.driver-popover{}', license }
  for (const [name, body] of Object.entries(files)) if (name !== omit) writeFileSync(path.join(root, 'node_modules/driver.js', name), body)
  return root
}

test('copies the pinned distribution and a checksum manifest, idempotently', async () => {
  const root = fixture()
  try {
    const first = await copyDriverAssets({ root })
    const dir = path.join(root, 'public/vendor/driver', DRIVER_VERSION)
    assert.equal(first.target, dir)
    for (const name of ['driver.js.iife.js', 'driver.css', 'license', 'manifest.json']) assert.ok(existsSync(path.join(dir, name)), name)
    const manifest = JSON.parse(readFileSync(path.join(dir, 'manifest.json'), 'utf8'))
    assert.equal(manifest.version, DRIVER_VERSION)
    assert.equal(manifest.license, 'MIT')
    assert.equal(manifest.files['driver.css'].bytes, '.driver-popover{}'.length)
    const before = readFileSync(path.join(dir, 'manifest.json'), 'utf8')
    await copyDriverAssets({ root })
    assert.equal(readFileSync(path.join(dir, 'manifest.json'), 'utf8'), before)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('fails loudly on version drift, unpinned dependency, missing files or a stripped licence', async () => {
  const cases = [
    [{ version: '1.8.1' }, /1\.8\.1 is installed but 1\.8\.0 is required/],
    [{ pinned: '^1.8.0' }, /pin driver\.js to exactly 1\.8\.0/],
    [{ omit: 'dist/driver.js.iife.js' }, /missing dist\/driver\.js\.iife\.js/],
    [{ omit: 'license' }, /missing license/],
    [{ license: 'proprietary' }, /MIT notice/],
  ]
  for (const [options, pattern] of cases) {
    const root = fixture(options)
    try { await assert.rejects(copyDriverAssets({ root }), pattern) } finally { rmSync(root, { recursive: true, force: true }) }
  }
})

test('the real installed package is copied byte for byte', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'driver-real-'))
  try {
    cpSync('package.json', path.join(root, 'package.json'))
    mkdirSync(path.join(root, 'node_modules'), { recursive: true })
    cpSync('node_modules/driver.js', path.join(root, 'node_modules/driver.js'), { recursive: true })
    const { target } = await copyDriverAssets({ root })
    assert.deepEqual(readFileSync(path.join(target, 'driver.js.iife.js')), readFileSync('node_modules/driver.js/dist/driver.js.iife.js'))
    assert.deepEqual(readFileSync(path.join(target, 'license')), readFileSync('node_modules/driver.js/license'))
  } finally { rmSync(root, { recursive: true, force: true }) }
})

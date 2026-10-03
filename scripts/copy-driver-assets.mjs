import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const DRIVER_VERSION = '1.8.0'
// The package `exports` map does not expose the IIFE build, so it is copied by path.
const FILES = [
  ['dist/driver.js.iife.js', 'driver.js.iife.js'],
  ['dist/driver.css', 'driver.css'],
  ['license', 'license'],
]
const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sha256 = (data) => createHash('sha256').update(data).digest('hex')

async function readJson(file, hint) {
  try { return JSON.parse(await readFile(file, 'utf8')) }
  catch { throw new Error(`${hint} (${file})`) }
}

async function writeIfChanged(file, data) {
  let current = null
  try { current = await readFile(file) } catch { /* first copy */ }
  const next = Buffer.isBuffer(data) ? data : Buffer.from(data)
  if (!current || !current.equals(next)) await writeFile(file, next)
}

export async function copyDriverAssets({ root = defaultRoot } = {}) {
  const own = await readJson(path.join(root, 'package.json'), 'Cannot read package.json')
  if (own.dependencies?.['driver.js'] !== DRIVER_VERSION) {
    throw new Error(`package.json must pin driver.js to exactly ${DRIVER_VERSION}`)
  }
  const packageDir = path.join(root, 'node_modules', 'driver.js')
  const pkg = await readJson(path.join(packageDir, 'package.json'), 'driver.js is not installed. Run "npm ci" first')
  if (pkg.version !== DRIVER_VERSION) {
    throw new Error(`driver.js ${pkg.version} is installed but ${DRIVER_VERSION} is required`)
  }
  if (pkg.license !== 'MIT') throw new Error(`driver.js license changed to ${pkg.license}; review before shipping`)

  const target = path.join(root, 'public', 'vendor', 'driver', DRIVER_VERSION)
  await mkdir(target, { recursive: true })
  const manifest = { name: 'driver.js', version: DRIVER_VERSION, license: 'MIT', files: {} }
  for (const [from, to] of FILES) {
    let data
    try { data = await readFile(path.join(packageDir, from)) }
    catch { throw new Error(`driver.js ${DRIVER_VERSION} is missing ${from}`) }
    if (data.length === 0) throw new Error(`driver.js ${DRIVER_VERSION} ${from} is empty`)
    await writeIfChanged(path.join(target, to), data)
    manifest.files[to] = { bytes: data.length, sha256: sha256(data) }
  }
  const notice = await readFile(path.join(target, 'license'), 'utf8')
  if (!/MIT License/i.test(notice) || !/Permission is hereby granted/.test(notice)) {
    throw new Error('driver.js license file does not carry the MIT notice')
  }
  await writeIfChanged(path.join(target, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  return { target, manifest }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  copyDriverAssets().then(({ target, manifest }) => {
    console.log(`driver.js ${manifest.version}: ${Object.keys(manifest.files).length} files -> ${path.relative(defaultRoot, target)}`)
  }).catch((error) => {
    console.error(`copy-driver-assets: ${error.message}`)
    process.exit(1)
  })
}

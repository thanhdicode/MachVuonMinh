// Real-browser harness for the Cú Mạch guide. puppeteer-core is not a project dependency:
// install it in node_modules/.owl-guide-qa-tools or point PUPPETEER_CORE at its entry file.
import { existsSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const TOOL_PACKAGE = join(ROOT, 'node_modules', '.owl-guide-qa-tools', 'package.json')

export const toImportSpecifier = (value) => isAbsolute(value) ? pathToFileURL(value).href : value

export function resolvePuppeteerSpecifier(env = process.env) {
  if (env.PUPPETEER_CORE) return toImportSpecifier(env.PUPPETEER_CORE)
  try { return import.meta.resolve('puppeteer-core') } catch {}
  if (existsSync(TOOL_PACKAGE)) return pathToFileURL(createRequire(TOOL_PACKAGE).resolve('puppeteer-core')).href
  throw new Error('puppeteer-core not found. Run: npm install --prefix node_modules/.owl-guide-qa-tools puppeteer-core')
}

const playwrightCandidates = (localAppData) => {
  const base = localAppData && join(localAppData, 'ms-playwright')
  if (!base || !existsSync(base)) return []
  return readdirSync(base, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^(chromium|chromium_headless_shell)-\d+$/.test(entry.name))
    .sort((a, b) => b.name.localeCompare(a.name, undefined, { numeric: true }))
    .map((entry) => entry.name.startsWith('chromium_headless_shell-')
      ? join(base, entry.name, 'chrome-headless-shell-win64', 'chrome-headless-shell.exe')
      : join(base, entry.name, 'chrome-win64', 'chrome.exe'))
}

export function resolveChromeExecutable(env = process.env) {
  const override = env.CHROME_PATH || env.PUPPETEER_EXECUTABLE_PATH
  if (override) {
    if (existsSync(override)) return override
    throw new Error(`Chrome executable does not exist: ${override}`)
  }
  const candidates = process.platform === 'win32' ? [
    env.LOCALAPPDATA && join(env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    env.ProgramFiles && join(env.ProgramFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    env['ProgramFiles(x86)'] && join(env['ProgramFiles(x86)'], 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    ...playwrightCandidates(env.LOCALAPPDATA),
  ] : process.platform === 'darwin' ? [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    join(homedir(), 'Applications', 'Google Chrome.app', 'Contents', 'MacOS', 'Google Chrome'),
  ] : [
    '/usr/local/bin/google-chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ]
  const executable = candidates.find((candidate) => candidate && existsSync(candidate))
  if (executable) return executable
  throw new Error('Chrome/Chromium not found. Set CHROME_PATH to its executable.')
}

let puppeteer
async function loadPuppeteer() {
  if (!puppeteer) {
    const loaded = await import(resolvePuppeteerSpecifier())
    puppeteer = loaded.default ?? loaded
  }
  return puppeteer
}

export async function launch({ width = 1440, height = 900, touch = false, scale = 1, args = [] } = {}) {
  const runtime = await loadPuppeteer()
  const browser = await runtime.launch({
    executablePath: resolveChromeExecutable(), headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', `--window-size=${width},${height}`, ...args],
  })
  const page = await browser.newPage()
  await page.setViewport({ width, height, deviceScaleFactor: scale, isMobile: touch, hasTouch: touch })
  const errors = []
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console.error: ${m.text()}`) })
  page.on('requestfailed', (r) => errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`))
  return { browser, page, errors }
}

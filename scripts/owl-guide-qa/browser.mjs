// Real-browser harness for the Cú Mạch guide. puppeteer-core is not a project dependency:
// install it anywhere (npm i puppeteer-core) and point PUPPETEER_CORE at it, or run from a folder that resolves it.
const loaded = process.env.PUPPETEER_CORE ? await import(process.env.PUPPETEER_CORE) : await import('puppeteer-core')
export const puppeteer = loaded.default ?? loaded
export async function launch({ width = 1440, height = 900, touch = false, scale = 1, args = [] } = {}) {
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || '/usr/local/bin/google-chrome', headless: true,
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

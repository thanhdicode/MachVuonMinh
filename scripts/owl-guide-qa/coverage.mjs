// Usage: node scripts/owl-guide-qa/coverage.mjs
// Aggregates every result.json under .studio/qa/owl-guide/{walk,responsive} into COVERAGE.md: for each of the 70 step IDs, which
// real-browser runs reached it and whether a run flagged it. A step no run reached is reported as a gap, never filled in.
// Hand-recorded evidence (steps that no walker can reach, e.g. the first-visit welcome) lives in manual-evidence.json.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createGuideCatalog, MODULE_LABELS, STEP_WIRING } from '../../src/onboarding/guideCatalog.ts'
import { ALL_STEP_IDS, moduleOfStep } from '../../src/onboarding/guideIds.ts'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const QA = join(ROOT, '.studio/qa/owl-guide')
const catalog = createGuideCatalog()
const stepIds = new Set(ALL_STEP_IDS)

const resultFiles = []
for (const area of ['walk', 'responsive']) {
  const base = join(QA, area)
  if (!existsSync(base)) continue
  for (const entry of readdirSync(base, { withFileTypes: true })) {
    const file = join(base, entry.name, 'result.json')
    // before-*, diag-* and v1-* are pre-fix baselines and one-off diagnostics, not evidence for the code as shipped.
    if (entry.isDirectory() && !/^(before-|diag-|v1-|_)/.test(entry.name) && existsSync(file)) resultFiles.push(file)
  }
}

const modeOf = (run) => {
  const w = run.viewport?.w ?? run.width, h = run.viewport?.h ?? run.height
  return [`${w}×${h}`, run.touch && 'touch', run.reduced && 'reduced-motion', run.zoom > 1 && `zoom ${run.zoom * 100}%`, run.textOnly > 1 && `text ${run.textOnly * 100}%`, run.textScale > 1 && `text ${run.textScale * 100}%`].filter(Boolean).join(' ')
}

const flagsOf = (r) => {
  const flags = []
  if (r.failure) flags.push(`failure: ${r.failure}`)
  if (r.titleOk === false) flags.push('title≠catalog')
  if (r.textOk === false) flags.push('text≠catalog')
  if (r.skipVisible === false) flags.push('skip-hidden')
  if (r.skipCovered) flags.push(`skip-covered(${r.skipCovered})`)
  if (r.popoverInViewport === false) flags.push('popover-outside-viewport')
  if (r.leftovers) flags.push('leftover-layers')
  for (const issue of r.issues ?? []) flags.push(String(issue))
  return flags
}

const runs = []
const byStep = new Map(ALL_STEP_IDS.map((id) => [id, []]))
for (const file of resultFiles) {
  const run = JSON.parse(readFileSync(file, 'utf8'))
  const tag = relative(QA, file).replace(/\/result\.json$/, '')
  // After F04 the walkers hand over to the game iframe, which they cannot read: that tail is game-walk.mjs's evidence, not a failure.
  const entries = (run.results ?? []).filter((r) => stepIds.has(r.id) && !(moduleOfStep(r.id) === 'game' && run.moduleId !== 'game'))
  const flagged = entries.filter((r) => flagsOf(r).length)
  runs.push({ tag, mode: modeOf(run), moduleId: run.moduleId, steps: entries.length, flagged: flagged.length, errors: Array.isArray(run.errors) ? run.errors.length : 0 })
  for (const r of entries) byStep.get(r.id).push({ tag, flags: flagsOf(r), overlap: r.overlapArea })
}

const manualFile = join(QA, 'manual-evidence.json')
const manual = existsSync(manualFile) ? JSON.parse(readFileSync(manualFile, 'utf8')) : {}

const cell = (text) => String(text).replaceAll('|', '\\|').replaceAll('\n', ' ')
const lines = []
const reached = ALL_STEP_IDS.filter((id) => byStep.get(id).length)
const gaps = ALL_STEP_IDS.filter((id) => !byStep.get(id).length)
const onlyManual = gaps.filter((id) => manual[id])
const open = gaps.filter((id) => !manual[id])

lines.push('# Cú Mạch · độ phủ 70 bước trong trình duyệt thật', '')
lines.push('Sinh bởi `node scripts/owl-guide-qa/coverage.mjs` từ các `result.json` do walker ghi (`walk/`, `responsive/`) và `manual-evidence.json`. Chrome thật (puppeteer-core, kết xuất phần mềm), không phải jsdom.', '')
lines.push('## Tóm tắt', '')
lines.push(`- ${reached.length}/70 ID có ít nhất một lượt walker đi tới.`)
if (onlyManual.length) lines.push(`- ${onlyManual.length} ID chỉ có bằng chứng thủ công (kịch bản vòng đời, không phải walker): ${onlyManual.join(', ')}.`)
lines.push(open.length ? `- **${open.length} ID chưa có bằng chứng nào:** ${open.join(', ')}.` : '- Không còn ID nào thiếu bằng chứng.')
const flaggedSteps = ALL_STEP_IDS.filter((id) => byStep.get(id).some((x) => x.flags.length))
lines.push(flaggedSteps.length ? `- ${flaggedSteps.length} ID có ít nhất một lượt bị gắn cờ (xem mục Cờ).` : '- Không lượt nào gắn cờ.', '')

lines.push('## Các lượt chạy', '', '| Lượt | Màn hình / chế độ | Phần | Bước ghi nhận | Bước có cờ | Lỗi console |', '|---|---|---|---:|---:|---:|')
for (const run of runs.sort((a, b) => a.tag.localeCompare(b.tag))) lines.push(`| ${cell(run.tag)} | ${cell(run.mode)} | ${cell(run.moduleId)} | ${run.steps} | ${run.flagged} | ${run.errors} |`)
lines.push('')

lines.push('## Theo từng ID', '', '| # | ID | Phần | Tiêu đề | Đích `data-guide` | Lượt sạch / tổng | Ghi chú |', '|---:|---|---|---|---|---:|---|')
ALL_STEP_IDS.forEach((id, index) => {
  const list = byStep.get(id)
  const clean = list.filter((x) => !x.flags.length).length
  const notes = []
  if (!list.length) notes.push(manual[id] ? `thủ công: ${manual[id]}` : 'CHƯA có bằng chứng')
  else if (manual[id]) notes.push(`thủ công: ${manual[id]}`)
  const bad = list.filter((x) => x.flags.length)
  if (bad.length) notes.push(`gắn cờ ở ${bad.length} lượt`)
  lines.push(`| ${index + 1} | \`${id}\` | ${cell(MODULE_LABELS[moduleOfStep(id)])} | ${cell(catalog.get(id).title)} | \`${STEP_WIRING[id].target}\` | ${clean}/${list.length} | ${cell(notes.join('; '))} |`)
})
lines.push('')

lines.push('## Cờ', '')
if (!flaggedSteps.length) lines.push('Không có.')
for (const id of flaggedSteps) for (const x of byStep.get(id).filter((y) => y.flags.length)) lines.push(`- \`${id}\` @ ${x.tag}: ${x.flags.join(' · ')}`)
lines.push('')
writeFileSync(join(QA, 'COVERAGE.md'), lines.join('\n'))
console.log(`COVERAGE.md: ${reached.length}/70 reached, ${onlyManual.length} manual only, ${open.length} open, ${flaggedSteps.length} flagged steps, ${runs.length} runs`)
if (open.length) console.log('open:', open.join(' '))

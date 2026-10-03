// Usage: node scripts/owl-guide-qa/summarize.mjs [--rows] <result.json|dir> ...
// Prints one row per matrix-walk run and every step that carries issues. --rows prints markdown table rows only.
import { readFileSync, existsSync, statSync } from 'node:fs'
const args = process.argv.slice(2), rowsOnly = args.includes('--rows')
for (const input of args.filter((a) => !a.startsWith('--'))) {
  const file = existsSync(input) && statSync(input).isDirectory() ? `${input}/result.json` : input
  if (!existsSync(file)) { console.log(`missing ${file}`); continue }
  const run = JSON.parse(readFileSync(file, 'utf8'))
  const steps = run.results.filter((x) => !x.failure && x.id !== 'END' && !String(x.id).includes(':'))
  const issues = run.results.filter((x) => x.issues?.length)
  const mode = [`${run.viewport?.w ?? run.width}x${run.viewport?.h ?? run.height}`, run.touch && 'touch', run.reduced && 'reduced', run.zoom > 1 && `zoom${run.zoom * 100}%`, run.textOnly > 1 && `text${run.textOnly * 100}%`].filter(Boolean).join(' ')
  const failures = run.results.filter((x) => x.failure)
  const end = run.results.find((x) => x.id === 'END')
  const row = `| ${run.tag} | ${mode} | ${run.moduleId ?? 'states'} | ${steps.length}${end ? ' + end' : ' (no END)'} | ${issues.length} steps with issues${failures.length ? `, ${failures.length} walk failure(s)` : ''}${run.errors?.length ? `, ${run.errors.length} console/page error(s)` : ''} | ${file.replace(/^.*\.studio\//, '.studio/')} |`
  console.log(row)
  if (rowsOnly) continue
  for (const x of issues) console.log(`   ${x.id}${x.presenter ? ` [${x.presenter}${x.kind ? '/' + x.kind : ''}]` : ''}: ${x.issues.join(' | ')}`)
  for (const x of failures) console.log(`   FAIL ${x.id}: ${x.failure}`)
  for (const e of (run.errors ?? []).slice(0, 4)) console.log(`   ERR ${e.slice(0, 160)}`)
}

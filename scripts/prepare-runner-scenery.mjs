// Encoding and alpha-bound inspection only; visual editing is done with imagegen.
// Usage: node scripts/prepare-runner-scenery.mjs [path-to-sharp-module]
import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'

const sharp = createRequire(import.meta.url)(process.argv[2] || 'sharp')
const sourcePath = '.studio/game-runner/originals/scenery-atlas.png'
const runtimePath = 'public/minigame/runner/images/scenery-atlas.webp'
const manifestPath = 'public/minigame/runner/manifest.json'
const source = await readFile(sourcePath)
const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
if (info.width !== 1374 || info.height !== 1145) throw new Error('Reinspect cell boundaries for a different atlas size')

// Verified separators in the generated sheet, not an assumed perfectly regular grid.
const xs = [0, 477, 927, 1374], ys = [0, 278, 504, 717, 931, 1145]
const nativeCrops = Array.from({ length: 5 }, (_, row) => Array.from({ length: 3 }, (_, col) => {
  let left = xs[col + 1], top = ys[row + 1], right = -1, bottom = -1
  for (let y = ys[row]; y < ys[row + 1]; y++) for (let x = xs[col]; x < xs[col + 1]; x++) {
    if (data[(y * info.width + x) * 4 + 3] <= 16) continue
    left = Math.min(left, x); right = Math.max(right, x)
    top = Math.min(top, y); bottom = Math.max(bottom, y)
  }
  if (right < left || bottom < top) throw new Error(`Empty scenery cell ${row}:${col}`)
  return { x: left, y: top, width: right - left + 1, height: bottom - top + 1 }
}))
// One source pixel cluster becomes a crisp runtime cluster; no expensive HD prop texture on mobile.
const width = 768, height = 640, scale = width / info.width
const stages = nativeCrops.map((row) => row.map((crop) => {
  const x = Math.floor(crop.x * scale), y = Math.floor(crop.y * scale)
  return { x, y, width: Math.ceil((crop.x + crop.width) * scale) - x, height: Math.ceil((crop.y + crop.height) * scale) - y }
}))
const runtime = await sharp(source).resize(width, height, { kernel: 'nearest' }).webp({ lossless: true, effort: 6 }).toBuffer()
await writeFile(runtimePath, runtime)
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
manifest.sprites.pixel_scenery = 'images/scenery-atlas.webp'
manifest.scenery = {
  atlas: 'pixel_scenery', width, height, nativeSize: [info.width, info.height], stages,
  provenance: 'Original built-in imagegen atlas matched to the five project panoramas; alpha cleanup edit; prompts and native PNG retained',
  sourceSha256: hash(source), runtimeSha256: hash(runtime), bytes: runtime.length,
}
manifest.files = manifest.files.filter((file) => file.path !== manifest.sprites.pixel_scenery)
manifest.files.push({ path: manifest.sprites.pixel_scenery, bytes: runtime.length, sha256: hash(runtime) })
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
console.log(JSON.stringify({ width, height, bytes: runtime.length, sourceSha256: hash(source), stages }))

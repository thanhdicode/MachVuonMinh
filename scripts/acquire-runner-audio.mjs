import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { inflateRawSync } from 'node:zlib'

const scratch = '.studio/game-runner/resources/audio'
const output = 'public/minigame/runner/audio'
const packs = [
  {
    id: 'kenney-impact-sounds',
    page: 'https://kenney.nl/assets/impact-sounds',
    archive: 'https://kenney.nl/media/pages/assets/impact-sounds/87b4ddecda-1677589768/kenney_impact-sounds.zip',
    sha256: '029d734af1582474edf3a694d1b0cebc97c1c152f2f39fa34d4c2bafc5de77f8',
    scratch: 'kenney_impact-sounds.zip',
    license: 'LICENSE-impact-sounds.txt',
    chosen: {
      land: ['Audio/impactGeneric_light_000.ogg', 'land.ogg'],
      hit: ['Audio/impactPunch_heavy_000.ogg', 'hit.ogg'],
      boss: ['Audio/impactMetal_heavy_001.ogg', 'boss.ogg'],
    },
  },
  {
    id: 'kenney-interface-sounds',
    page: 'https://kenney.nl/assets/interface-sounds',
    archive: 'https://kenney.nl/media/pages/assets/interface-sounds/fa43c1dd4d-1677589452/kenney_interface-sounds.zip',
    sha256: 'f2193d072726d6758a5f7871b2dcc54dcce0d5c35c6f0a62f92549b327c81232',
    scratch: 'kenney_interface-sounds.zip',
    license: 'LICENSE-interface-sounds.txt',
    chosen: {
      jump: ['Audio/pluck_001.ogg', 'jump.ogg'],
      duck: ['Audio/switch_003.ogg', 'duck.ogg'],
      correct: ['Audio/confirmation_001.ogg', 'correct.ogg'],
      wrong: ['Audio/error_006.ogg', 'wrong.ogg'],
      transition: ['Audio/open_003.ogg', 'transition.ogg'],
      win: ['Audio/confirmation_004.ogg', 'win.ogg'],
      click: ['Audio/click_003.ogg', 'click.ogg'],
    },
  },
]

const digest = bytes => createHash('sha256').update(bytes).digest('hex')

function entries(bytes) {
  let end = bytes.length - 22
  while (end >= 0 && bytes.readUInt32LE(end) !== 0x06054b50) end -= 1
  if (end < 0) throw new Error('ZIP end record missing')
  const count = bytes.readUInt16LE(end + 10)
  let offset = bytes.readUInt32LE(end + 16)
  const found = new Map()
  for (let index = 0; index < count; index += 1) {
    if (bytes.readUInt32LE(offset) !== 0x02014b50) throw new Error('ZIP directory entry missing')
    const method = bytes.readUInt16LE(offset + 10)
    const compressedSize = bytes.readUInt32LE(offset + 20)
    const nameLength = bytes.readUInt16LE(offset + 28)
    const extraLength = bytes.readUInt16LE(offset + 30)
    const commentLength = bytes.readUInt16LE(offset + 32)
    const localOffset = bytes.readUInt32LE(offset + 42)
    const name = bytes.subarray(offset + 46, offset + 46 + nameLength).toString('utf8')
    const localNameLength = bytes.readUInt16LE(localOffset + 26)
    const localExtraLength = bytes.readUInt16LE(localOffset + 28)
    const start = localOffset + 30 + localNameLength + localExtraLength
    const compressed = bytes.subarray(start, start + compressedSize)
    if (!name.endsWith('/')) {
      if (method === 0) found.set(name, Buffer.from(compressed))
      else if (method === 8) found.set(name, inflateRawSync(compressed))
      else throw new Error(`Unsupported ZIP method ${method}: ${name}`)
    }
    offset += 46 + nameLength + extraLength + commentLength
  }
  return found
}

async function archive(pack) {
  const path = `${scratch}/${pack.scratch}`
  let bytes
  try { bytes = await readFile(path) } catch (_) {}
  if (!bytes || digest(bytes) !== pack.sha256) {
    const response = await fetch(pack.archive)
    if (!response.ok) throw new Error(`${response.status}: ${pack.archive}`)
    bytes = Buffer.from(await response.arrayBuffer())
    if (digest(bytes) !== pack.sha256) throw new Error(`Archive integrity mismatch: ${pack.id}`)
    await writeFile(path, bytes)
  }
  return bytes
}

await mkdir(scratch, { recursive: true })
await mkdir(output, { recursive: true })
const manifest = { license: 'Creative Commons Zero v1.0 Universal (CC0-1.0)', packs: [], files: {} }

for (const pack of packs) {
  const bytes = await archive(pack)
  const zip = entries(bytes)
  const license = zip.get('License.txt')
  if (!license || !/Creative Commons Zero|CC0/i.test(license.toString('utf8'))) throw new Error(`CC0 license missing: ${pack.id}`)
  await writeFile(`${output}/${pack.license}`, license)
  const chosenFiles = []
  for (const [kind, [sourceEntry, file]] of Object.entries(pack.chosen)) {
    const asset = zip.get(sourceEntry)
    if (!asset || asset.subarray(0, 4).toString() !== 'OggS') throw new Error(`OGG entry missing: ${sourceEntry}`)
    await writeFile(`${output}/${file}`, asset)
    chosenFiles.push(sourceEntry)
    manifest.files[kind] = { file, pack: pack.id, sourceEntry, sha256: digest(asset) }
  }
  manifest.packs.push({
    id: pack.id,
    author: 'Kenney',
    sourcePage: pack.page,
    archiveUrl: pack.archive,
    archiveSha256: pack.sha256,
    license: 'CC0-1.0',
    licenseFile: pack.license,
    chosenFiles,
  })
}

await writeFile(`${output}/manifest.json`, JSON.stringify(manifest, null, 2) + '\n')
console.log(`Acquired ${Object.keys(manifest.files).length} Kenney CC0 runner effects from ${packs.length} verified archives.`)

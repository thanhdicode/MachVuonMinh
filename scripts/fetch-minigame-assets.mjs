import { mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

// Pinned upstream snapshot: sprites and their original CC0 license files only.
const revision = '782e3a09566b4bb3d98fe2ed07f5a8545e6fcfd4'
const repository = 'https://raw.githubusercontent.com/series-ai/jam-ready-assets/' + revision + '/'
const output = 'public/minigame/sprites'
await mkdir(output, { recursive: true })
const files = {}
function add(key, pack, path) { files[key] = { path: `${pack}/${path}`, file: `${key}.png` } }
const humanPack = 'kenney-platformer-characters-1/2D/platformer'
const robotPack = 'kenney-robot-pack/2D/space-scifi'
const scenePack = 'kenney-new-platformer-pack/2D/platformer'
for (const person of ['adventurer', 'female']) for (const pose of ['idle', 'walk1', 'walk2', 'jump', 'duck', 'hurt']) {
  const directory = person === 'adventurer' ? 'Adventurer' : 'Female'
  add(`${person}_${pose}`, humanPack, `PNG/${directory}/Poses/${person}_${pose}.png`)
}
for (const color of ['yellow', 'green', 'blue', 'red']) for (const pose of ['Drive1', 'Drive2', 'Jump', 'Hurt']) {
  add(`robot_${color}_${pose}`, robotPack, `PNG/Side view/robot_${color}${pose}.png`)
}
for (const name of ['block_idle','block_fall','fly_a','fly_b','saw_a','saw_b','slime_spike_walk_a','slime_spike_walk_b']) {
  add(name, scenePack, `Sprites/Enemies/Default/${name}.png`)
}
for (const name of ['block_planks','block_strong_danger','spikes','rock','bush','grass','terrain_grass_block_top','terrain_grass_block_center','terrain_stone_block_top','terrain_stone_block_center']) {
  add(name, scenePack, `Sprites/Tiles/Default/${name}.png`)
}
for (const name of ['background_clouds','background_color_hills','background_color_trees']) {
  add(name, scenePack, `Sprites/Backgrounds/Double/${name}.png`)
}
for (const [name, pack] of [['characters',humanPack],['robots',robotPack],['platformer',scenePack]]) {
  files[`license_${name}`] = { path: `${pack}/License.txt`, file: `LICENSE-${name}.txt` }
}
const entries = Object.entries(files)
for (let index = 0; index < entries.length; index += 6) {
  await Promise.all(entries.slice(index,index+6).map(async ([, asset]) => {
    const response = await fetch(repository + asset.path.split('/').map(encodeURIComponent).join('/'))
    if (!response.ok) throw new Error(`${response.status}: ${asset.path}`)
    let bytes = Buffer.from(await response.arrayBuffer())
    if (bytes.toString().startsWith('version https://git-lfs.github.com/spec/v1')) {
      const digest = bytes.toString().match(/oid sha256:(\w+)/)[1]
      const media = await fetch(`https://media.githubusercontent.com/media/series-ai/jam-ready-assets/${revision}/` + asset.path.split('/').map(encodeURIComponent).join('/'))
      if (!media.ok) throw new Error(`LFS download ${media.status}: ${asset.path}`)
      bytes = Buffer.from(await media.arrayBuffer())
      if (createHash('sha256').update(bytes).digest('hex') !== digest) throw new Error('LFS integrity mismatch')
    }
    if (asset.file.endsWith('.png') && bytes.subarray(0,8).toString('hex') !== '89504e470d0a1a0a') throw new Error('Expected a real PNG sprite')
    if (asset.file.endsWith('.txt') && !/CC0|Creative Commons Zero/i.test(bytes.toString())) throw new Error('Unexpected asset license')
    await writeFile(`${output}/${asset.file}`, bytes)
  }))
}
const sprites = Object.fromEntries(entries.filter(([,asset])=>asset.file.endsWith('.png')).map(([key,asset])=>[key,asset.file]))
await writeFile('src/minigame/assets/sprites.json', JSON.stringify(sprites,null,2)+'\n')
await writeFile(`${output}/SOURCE.json`, JSON.stringify({ repository:'https://github.com/series-ai/jam-ready-assets', revision, files },null,2)+'\n')
console.log(`Downloaded ${Object.keys(sprites).length} sprites and three original CC0 licenses.`)

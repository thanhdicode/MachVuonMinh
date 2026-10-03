import {readFile, mkdir, copyFile, stat} from 'node:fs/promises'
import {createRequire} from 'node:module'
const require=createRequire(import.meta.url)
const sharp=require('C:/Users/ADMIN/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp')
const assets=JSON.parse(await readFile('.studio/history/generated-assets.json','utf8'))
await mkdir('.studio/history/originals',{recursive:true})
await mkdir('public/images/history',{recursive:true})
const report=[]
for (const {id,path} of assets) {
  await copyFile(path,`.studio/history/originals/${id}.png`)
  const meta=await sharp(path).metadata()
  if (id.endsWith('-archive')) {
    await sharp(path).resize({width:1600}).webp({quality:75}).toFile(`public/images/history/${id}.webp`)
  } else {
    const cutout=await sharp(path).trim().extend({top:20,bottom:20,left:20,right:20,background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer()
    for (const width of [768,1440]) {
      const out=`public/images/history/${id}-${width}.webp`
      await sharp(cutout).resize({width}).webp({quality:80,alphaQuality:85}).toFile(out)
      if ((await stat(out)).size>450000) await sharp(cutout).resize({width}).webp({quality:68,alphaQuality:75}).toFile(out)
    }
    await sharp(cutout).resize({width:Math.max(2048,meta.width)}).webp({quality:92,alphaQuality:100}).toFile(`public/images/history/${id}-zoom.webp`)
  }
  report.push({id,width:meta.width,height:meta.height,alpha:meta.hasAlpha})
}
console.log(JSON.stringify(report))
const tiles=await Promise.all(assets.slice(0,8).map(async({path},i)=>({input:await sharp(path).resize(500,330,{fit:'contain',background:'#f3e8d0'}).flatten({background:'#f3e8d0'}).png().toBuffer(),left:(i%2)*500,top:Math.floor(i/2)*330})))
await sharp({create:{width:1000,height:1320,channels:3,background:'#f3e8d0'}}).composite(tiles).png().toFile('.studio/history/asset-contact.png')

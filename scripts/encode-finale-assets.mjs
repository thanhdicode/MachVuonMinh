import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises'
import {createRequire} from 'node:module'
import {createHash} from 'node:crypto'
import path from 'node:path'
const sharp=createRequire(import.meta.url)('C:/Users/ADMIN/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp')
const names=['human-hand','robot-hand'],sources=process.argv.slice(2)
if(sources.length!==2)throw Error('Pass the two original transparent PNG paths, human then robot')
await mkdir('.studio/hand-finale/generated',{recursive:true})
await mkdir('public/images/finale',{recursive:true})
const manifest=[]
for(let i=0;i<2;i++){
 const data=await readFile(sources[i]),meta=await sharp(data).metadata()
 if(!meta.hasAlpha)throw Error(`${names[i]} is missing transparency`)
 const {data:rgba,info}=await sharp(data).ensureAlpha().raw().toBuffer({resolveWithObject:true})
 let transparent=0,solid=0,edgeX=i===0?0:info.width,edgeYs=[]
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
  const alpha=rgba[(y*info.width+x)*4+3]
  if(alpha===0)transparent++;if(alpha>=240)solid++
  // Ignore faint edge noise. Rightmost human and leftmost robot points are their index fingertips.
  if(alpha<220)continue
  if((i===0&&x>edgeX)||(i===1&&x<edgeX)){edgeX=x;edgeYs=[y]}else if(x===edgeX)edgeYs.push(y)
 }
 if(transparent<info.width*info.height*.2)throw Error(`${names[i]} has too little fully transparent background`)
 const tip=[edgeX,(Math.min(...edgeYs)+Math.max(...edgeYs))/2]
 const output=await sharp(data).resize({width:1680,withoutEnlargement:true}).webp({quality:90,alphaQuality:100,effort:6}).toBuffer()
 const encoded=await sharp(output).metadata()
 await copyFile(sources[i],path.join('.studio/hand-finale/generated',names[i]+'.png'))
 await writeFile(path.join('public/images/finale',names[i]+'.webp'),output)
 manifest.push({name:names[i],source:sources[i],width:meta.width,height:meta.height,tip,normalizedTip:tip.map((v,j)=>v/(j===0?meta.width:meta.height)),transparentPixels:transparent,opaquePixels:solid,alpha:encoded.hasAlpha,runtimeWidth:encoded.width,runtimeHeight:encoded.height,originalBytes:data.length,runtimeBytes:output.length,sha256:createHash('sha256').update(output).digest('hex')})
}
await writeFile('.studio/hand-finale/asset-manifest.json',JSON.stringify(manifest,null,2)+'\n')
console.log(JSON.stringify(manifest.map(({source,...r})=>r),null,2))

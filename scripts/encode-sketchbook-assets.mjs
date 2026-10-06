import {readFile,writeFile,copyFile,mkdir,unlink} from 'node:fs/promises'
import {createRequire} from 'node:module'
import {createHash} from 'node:crypto'
import path from 'node:path'
const sharp=createRequire(import.meta.url)('C:/Users/ADMIN/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp')
const folder=path.resolve('public/scene02-sketchbook/assets')
const archive=path.resolve('.studio/sketchbook-reference/generated')
await mkdir(archive,{recursive:true})
const records=JSON.parse(await readFile('.studio/sketchbook-reference/generated-assets.json','utf8'))
const result=[]
for(const item of records){
 const source=item.hint.match(/as (C:\\.+?\.png) by default/)[1]
 const bytes=await readFile(source),meta=await sharp(bytes).metadata()
 const output=await sharp(bytes).webp({quality:90,alphaQuality:100,effort:6}).toBuffer()
 await copyFile(source,path.join(archive,item.name+'.png'))
 await writeFile(path.join(folder,item.name+'.webp'),output)
 const redundant=path.resolve(folder,item.name+'.png')
 if(path.dirname(redundant)!==folder)throw Error('Unexpected output path')
 await unlink(redundant).catch(error=>{if(error.code!=='ENOENT')throw error})
 result.push({id:item.name,width:meta.width,height:meta.height,alpha:meta.hasAlpha,originalBytes:bytes.length,webBytes:output.length,sha256:createHash('sha256').update(output).digest('hex')})
}
await writeFile('.studio/sketchbook-reference/asset-manifest.json',JSON.stringify(result,null,2))
console.log(result.map(({id,webBytes})=>({id,webBytes})))
console.log('Total',result.reduce((sum,item)=>sum+item.webBytes,0))

import {mkdir,writeFile} from 'node:fs/promises'
import {createRequire} from 'node:module'
const require=createRequire(import.meta.url)
const sharp=require('C:/Users/ADMIN/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp')
const generated='C:/Users/ADMIN/.codex/generated_images/01a0fe4a-dbcb-7ab2-94e4-d1e7a8af83b1/'
await mkdir('public/images/machine-hall',{recursive:true})
const images=[['hall','exec-8bdbcfd7-6c95-4b1f-a69d-59fd7cd00a28.png'],['workers','exec-82ea0fa9-95d0-4d50-af51-186574572892.png']]
const metadata=[]
for(const [name,file] of images){
  const source=generated+file,meta=await sharp(source).metadata()
  if(name==='workers'&&!meta.hasAlpha)throw Error('Worker cutouts must preserve true transparency')
  await sharp(source).webp({quality:88,alphaQuality:100}).toFile(`public/images/machine-hall/${name}.webp`)
  metadata.push({name,source,width:meta.width,height:meta.height,hasAlpha:meta.hasAlpha})
}
await mkdir('.studio/line-shaft',{recursive:true})
await writeFile('.studio/line-shaft/assets.json',JSON.stringify(metadata,null,2))
console.log(metadata)

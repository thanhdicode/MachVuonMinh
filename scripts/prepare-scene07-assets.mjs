import {createRequire} from 'node:module'
import {readFile,writeFile,stat} from 'node:fs/promises'
import {createHash} from 'node:crypto'
const require=createRequire(import.meta.url)
const sharp=require('C:/Users/ADMIN/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp')
const assets=[]
for(const id of ['worker','owner','engineer']){
  const source=`.studio/scene07/originals/${id}.png`,output=`public/images/scene07/${id}.webp`
  const metadata=await sharp(source).metadata(),stats=await sharp(source).stats()
  if(!metadata.hasAlpha||stats.channels[3].min!==0)throw Error(`${id}: transparent alpha missing`)
  await sharp(source).resize({height:1024,withoutEnlargement:true}).webp({quality:88,alphaQuality:100}).toFile(output)
  assets.push({id,source,output,native:[metadata.width,metadata.height],alpha:true,bytes:(await stat(output)).size,sha256:createHash('sha256').update(await readFile(output)).digest('hex')})
}
await writeFile('.studio/scene07/assets.json',JSON.stringify(assets,null,2)+'\n');console.log(assets)

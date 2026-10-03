// Encode imagegen originals for delivery; never redraw, crop, recolor or remove alpha.
// npm install is not required when a bundled Sharp module path is provided.
import {readFile, writeFile, mkdir, stat} from 'node:fs/promises'
import {resolve, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createHash} from 'node:crypto'
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..')
const sourceDir=resolve(root,'.studio/guide-assets/originals')
const outputDir=resolve(root,'public/guide')
const sharp=(await import(process.env.MACH_GUIDE_SHARP_MODULE || 'sharp')).default
const ids=['neutral','point-left','point-right','inspect','practice','confirm','bye']
await mkdir(outputDir,{recursive:true})
const assets=[]
for(const id of [...ids,'dock']){
  const sourceId=id==='dock'?'neutral':id
  const source=resolve(sourceDir,sourceId+'.png')
  const bytes=await readFile(source), input=await sharp(bytes).metadata()
  if(!input.hasAlpha) throw Error(sourceId+': source must have actual alpha')
  const alpha=await sharp(bytes).extractChannel('alpha').stats()
  if(alpha.channels[0].min!==0 || alpha.channels[0].max!==255) throw Error(sourceId+': invalid transparency')
  const size=id==='dock'?80:256, name='owl-'+id+'.webp'
  const target=resolve(outputDir,name)
  await sharp(bytes).resize(size,size,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}})
    .webp({quality:82,alphaQuality:100,effort:6}).toFile(target)
  const delivered=await readFile(target), metadata=await sharp(delivered).metadata()
  if(!metadata.hasAlpha) throw Error(name+': exported alpha missing')
  assets.push({id,file:name,width:metadata.width,height:metadata.height,bytes:(await stat(target)).size,
    sha256:createHash('sha256').update(delivered).digest('hex'),source:'.studio/guide-assets/originals/'+sourceId+'.png',
    sourceSha256:createHash('sha256').update(bytes).digest('hex'),sourceWidth:input.width,sourceHeight:input.height})
}
const manifest={version:1,date:'2026-10-03',identity:'Cu Mach / concept direction 01',
  generation:'Built-in imagegen; original project artwork; no external stock pixels',
  encoding:'Sharp: contain resize only, transparent WebP q82 alpha100; originals unchanged',
  totalBytes:assets.reduce((n,a)=>n+a.bytes,0),assets}
await writeFile(resolve(outputDir,'owl-assets.json'),JSON.stringify(manifest,null,2)+'\n')
console.log(JSON.stringify({totalBytes:manifest.totalBytes,assets:assets.map(({id,bytes})=>({id,bytes}))}))

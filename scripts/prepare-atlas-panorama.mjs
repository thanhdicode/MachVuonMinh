import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import sharp from 'file:///C:/Users/ADMIN/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/dist/index.mjs'

const generatedInputs = [
  'C:/Users/ADMIN/.codex/generated_images/01a0fe3f-94cf-7ec2-b4c0-f8002c5f5b34/exec-389de5d3-1c79-4062-92d8-becaf1cb95eb.png',
  'C:/Users/ADMIN/.codex/generated_images/01a0fe3f-94cf-7ec2-b4c0-f8002c5f5b34/exec-e0cb0bd3-472a-4a5c-9ede-357b25f7b8ab.png',
  'C:/Users/ADMIN/.codex/generated_images/01a0fe3f-94cf-7ec2-b4c0-f8002c5f5b34/exec-a429ded1-3eee-4bca-a594-4522b54028be.png',
  'C:/Users/ADMIN/.codex/generated_images/01a0fe3f-94cf-7ec2-b4c0-f8002c5f5b34/exec-3533ccb7-7cc2-4877-85bf-5b0eabc7828e.png',
]
const originalDir = resolve('.studio/history/mural/originals')
const outputDir = resolve('public/history')
mkdirSync(originalDir, { recursive:true }); mkdirSync(outputDir, { recursive:true })
const inputs=generatedInputs.map((input,index)=>{
  const saved=resolve(originalDir,`segment-${String(index+1).padStart(2,'0')}.png`)
  if(!existsSync(saved))copyFileSync(input,saved)
  return saved
})

const segmentWidth = 1704, segmentHeight = 724, overlap = 341, step = segmentWidth - overlap
const cropLeft = [0, 234, 234, 468]
const stats = await Promise.all(inputs.map(input => sharp(input).stats()))
const luminance = stats.map(({channels}) => channels[0].mean*.2126 + channels[1].mean*.7152 + channels[2].mean*.0722)
const target = [...luminance].sort((a,b) => a-b)[1]
const feather = Buffer.from(`<svg width="${segmentWidth}" height="${segmentHeight}"><defs><linearGradient id="f" x1="0" y1="0" x2="100%" y2="0"><stop offset="0" stop-color="white" stop-opacity="0"/><stop offset="20%" stop-color="white" stop-opacity="1"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#f)"/></svg>`)

const segments = await Promise.all(inputs.map(async (input,index) => {
  let image = sharp(input).extract({left:cropLeft[index],top:0,width:segmentWidth,height:segmentHeight})
    .modulate({brightness:Math.max(.92,Math.min(1.08,target/luminance[index])),saturation:.88})
    .ensureAlpha()
  if(index) image=image.composite([{input:feather,blend:'dest-in'}])
  return image.png().toBuffer()
}))
const stitchedWidth = segmentWidth + step * 3
const stitched = await sharp({create:{width:stitchedWidth,height:segmentHeight,channels:4,background:{r:224,g:207,b:174,alpha:1}}})
  .composite(segments.map((input,index)=>({input,left:index*step,top:0}))).png().toBuffer()
const panorama = await sharp(stitched).extract({left:1,top:0,width:segmentHeight*8,height:segmentHeight}).resize(8192,1024,{fit:'fill'}).png().toBuffer()

await Promise.all([
  sharp(panorama).avif({quality:58,effort:6}).toFile(resolve(outputDir,'atlas-panorama-8192.avif')),
  sharp(panorama).resize(4096,512).webp({quality:82,effort:6}).toFile(resolve(outputDir,'atlas-panorama-4096.webp')),
])

const bandSize=1024, verticalOverlap=Math.round(bandSize*.2), verticalStep=bandSize-verticalOverlap, bandCount=10
const bandInputs=[]
for(let index=0;index<bandCount;index++){
  const left=Math.round(index*(8192-bandSize)/(bandCount-1))
  let band=sharp(panorama).extract({left,top:0,width:bandSize,height:bandSize}).ensureAlpha()
  if(index){
    const mask=Buffer.from(`<svg width="${bandSize}" height="${bandSize}"><defs><linearGradient id="f" x1="0" y1="0" x2="0" y2="100%"><stop offset="0" stop-color="white" stop-opacity="0"/><stop offset="20%" stop-color="white" stop-opacity="1"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#f)"/></svg>`)
    band=band.composite([{input:mask,blend:'dest-in'}])
  }
  bandInputs.push({input:await band.png().toBuffer(),left:0,top:index*verticalStep})
}
const verticalHeight=bandSize+(bandCount-1)*verticalStep
const vertical=await sharp({create:{width:bandSize,height:verticalHeight,channels:4,background:{r:224,g:207,b:174,alpha:1}}}).composite(bandInputs).png().toBuffer()
await sharp(vertical).extract({left:0,top:Math.floor((verticalHeight-8192)/2),width:1024,height:8192}).webp({quality:80,effort:6}).toFile(resolve(outputDir,'atlas-panorama-mobile-1024x8192.webp'))

await sharp(inputs[3]).extract({left:1448,top:0,width:724,height:724}).resize(1024,1024,{kernel:'lanczos3'}).webp({quality:86,effort:6}).toFile(resolve(outputDir,'atlas-machine-anchor.webp'))

for(const file of ['atlas-panorama-8192.avif','atlas-panorama-4096.webp','atlas-panorama-mobile-1024x8192.webp','atlas-machine-anchor.webp']){
  const path=resolve(outputDir,file), metadata=await sharp(path).metadata()
  console.log(`${file}: ${metadata.width}x${metadata.height}, ${Math.round(statSync(path).size/1024)} KiB`)
}

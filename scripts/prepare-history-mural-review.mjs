import sharp from 'file:///C:/Users/ADMIN/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/dist/index.mjs'
import {resolve} from 'node:path'
const out=resolve('.studio/qa/history-mural')
for(const [width,height] of [[1920,1080],[1440,900],[1366,768],[1024,768],[390,844]]){
  const columns=width===390?4:2,tileWidth=width===390?390:720,tileHeight=Math.round(height*tileWidth/width)
  const inputs=await Promise.all(Array.from({length:8},async(_,era)=>({input:await sharp(resolve(out,`${width}-${height}-era-${era}.png`)).resize(tileWidth,tileHeight).png().toBuffer(),left:(era%columns)*tileWidth,top:Math.floor(era/columns)*tileHeight})))
  await sharp({create:{width:tileWidth*columns,height:tileHeight*(8/columns),channels:3,background:'#f0e5cd'}}).composite(inputs).png().toFile(resolve(out,`contact-${width}.png`))
}
console.log('Five contact sheets created from the final forty native captures.')

// Convert the original 128px PMREM capture (RGBA half floats) to Radiance RGBE.
// Usage: node scripts/encode-studio-environment.mjs input.f16 output.hdr
import {readFile,writeFile} from 'node:fs/promises'
import {DataUtils} from 'three'

const [input,output]=process.argv.slice(2),width=384,height=512
if(!input||!output)throw Error('Supply input.f16 and output.hdr paths')
const source=await readFile(input)
if(source.length!==width*height*8)throw Error('Expected a 384 × 512 RGBA half-float capture')
const header=Buffer.from(`#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${height} +X ${width}\n`),chunks=[header]
let maxRelativeError=0
for(let y=0;y<height;y++){
  const channels=Array.from({length:4},()=>new Uint8Array(width))
  for(let x=0;x<width;x++){
    const at=(y*width+x)*8,rgb=[0,2,4].map(offset=>DataUtils.fromHalfFloat(source.readUInt16LE(at+offset)))
    if(!rgb.every(Number.isFinite))throw Error('Non-finite HDR sample')
    const max=Math.max(...rgb)
    if(max<1e-32)continue
    const exponent=Math.floor(Math.log2(max))+1,scale=256/2**exponent
    channels[3][x]=exponent+128
    rgb.forEach((value,c)=>{channels[c][x]=Math.max(0,Math.min(255,Math.floor(value*scale)));maxRelativeError=Math.max(maxRelativeError,Math.abs(channels[c][x]/scale-value)/max)})
  }
  chunks.push(Buffer.from([2,2,width>>8,width&255]))
  for(const channel of channels){
    const encoded=[]
    for(let i=0;i<width;){
      let run=1;while(run<127&&i+run<width&&channel[i+run]===channel[i])run++
      if(run>=4){encoded.push(128+run,channel[i]);i+=run;continue}
      const start=i;i+=run
      while(i<width&&i-start<128){
        run=1;while(run<4&&i+run<width&&channel[i+run]===channel[i])run++
        if(run>=4)break
        i+=Math.min(run,128-(i-start))
      }
      encoded.push(i-start,...channel.subarray(start,i))
    }
    chunks.push(Buffer.from(encoded))
  }
}
const result=Buffer.concat(chunks);await writeFile(output,result)
console.log(JSON.stringify({width,height,bytes:result.length,maxRelativeError}))

import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js'
import {DataUtils} from 'three'

test('baked studio loads as a finite HDR atlas with the original 128px PMREM layout',async()=>{
  const bytes=await readFile(new URL('../public/textures/studio-cubeuv.hdr',import.meta.url))
  const atlas=new HDRLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength))
  assert.equal(atlas.width,384);assert.equal(atlas.height,512);assert.equal(atlas.data.length,384*512*4)
  let brightest=0
  for(let i=0;i<atlas.data.length;i+=4){
    for(let c=0;c<3;c++){const value=DataUtils.fromHalfFloat(atlas.data[i+c]);assert.ok(Number.isFinite(value)&&value>=0);brightest=Math.max(brightest,value)}
    assert.equal(DataUtils.fromHalfFloat(atlas.data[i+3]),1)
  }
  assert.ok(brightest>1&&brightest<8,'HDR studio highlights must retain their radiance')
})

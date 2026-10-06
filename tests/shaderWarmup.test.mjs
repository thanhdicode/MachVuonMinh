import test from 'node:test'
import assert from 'node:assert/strict'
import * as warmup from '../src/experience/prepareScene.ts'

test('a shared material is not ready until every compiled program variant is ready',async()=>{
  assert.equal(typeof warmup.prepareScene,'function')
  let pending=true,resolved=false
  const context={getExtension:()=>({COMPLETION_STATUS_KHR:1}),isContextLost:()=>false,isProgram:()=>true,getProgramParameter:program=>program==='instanced'||!pending}
  const renderer={compileAsync:async()=>{},getContext:()=>context,info:{programs:['instanced','ordinary'].map(program=>({program,getUniforms(){},getAttributes(){}}))}}
  const preparation=warmup.prepareScene(renderer,{},{}).then(()=>{resolved=true})
  await new Promise(resolve=>setTimeout(resolve,2));assert.equal(resolved,false)
  pending=false;await preparation;assert.equal(resolved,true)
})
test('first-draw uniform reflection is completed during preparation and reused',async()=>{
  let reflected=0
  const program={program:'shared',getUniforms(){reflected++},getAttributes(){reflected++}}
  const context={getExtension:()=>({COMPLETION_STATUS_KHR:1}),isContextLost:()=>false,isProgram:()=>true,getProgramParameter:()=>true}
  const renderer={compileAsync:async()=>{},getContext:()=>context,info:{programs:[program]}}
  await warmup.prepareScene(renderer,{},{});assert.equal(reflected,2)
  await warmup.prepareScene(renderer,{},{});assert.equal(reflected,2)
})
test('disposed programs and lost contexts do not leave preparation pending',async()=>{
  assert.equal(typeof warmup.prepareScene,'function')
  for(const lost of [false,true]){
    const context={getExtension:()=>({COMPLETION_STATUS_KHR:1}),isContextLost:()=>lost,isProgram:()=>false,getProgramParameter:()=>{throw Error('Disposed program queried')}}
    await warmup.prepareScene({compileAsync:async()=>{},getContext:()=>context,info:{programs:[{program:'disposed'}]}},{},{})
  }
})

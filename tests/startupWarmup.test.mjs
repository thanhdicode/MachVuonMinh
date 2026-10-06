import test from 'node:test'
import assert from 'node:assert/strict'
import {prepareInStages} from '../src/experience/startupWarmup.ts'

test('the first scene becomes ready before later shaders and yields before each background group',async()=>{
  const events=[]
  let release
  const pending=new Promise(resolve=>{release=resolve})
  const warmup=prepareInStages({initial:['intro'],background:['farm','robot'],
    prepare:async value=>{events.push(value);if(value==='farm')await pending},
    yieldTask:async()=>{events.push('yield')},isCancelled:()=>false,onReady:()=>events.push('ready')})
  await new Promise(resolve=>setTimeout(resolve,0))
  assert.deepEqual(events,['intro','ready','yield','farm'])
  release();await warmup
  assert.deepEqual(events,['intro','ready','yield','farm','yield','robot'])
})

test('a disposed canvas stops between groups and never announces readiness',async()=>{
  let cancelled=false
  const events=[]
  await prepareInStages({initial:['intro','cord'],background:['farm'],
    prepare:async value=>{events.push(value);cancelled=true},yieldTask:async()=>{},
    isCancelled:()=>cancelled,onReady:()=>events.push('ready')})
  assert.deepEqual(events,['intro'])
})

test('cancellation during the background yield stops the next compilation',async()=>{
  let cancelled=false
  const events=[]
  await prepareInStages({initial:['intro'],background:['farm'],
    prepare:async value=>events.push(value),yieldTask:async()=>{cancelled=true},
    isCancelled:()=>cancelled,onReady:()=>events.push('ready')})
  assert.deepEqual(events,['intro','ready'])
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { flowBeat, flowProgress, flowJourneyProgress, flowJourneyPosition, accessResponse, splitterResponse, flowState, updateFlow, captureFlowInputs, restoreFlowInputs } from '../src/experience/scene07State.ts'
import * as workshop from '../src/experience/scene07State.ts'

test('opaque ready workshop owns the frame while loading and fades preserve the host',()=>{
  assert.equal(typeof workshop.workshopOwnsFrame,'function')
  const state={active:7},flow={static:false,renderReady:true,progress:.3,exit:0}
  assert.equal(workshop.workshopOwnsFrame(state,flow),true)
  for(const input of [{renderReady:false},{static:true},{progress:.02},{exit:.1}])assert.equal(workshop.workshopOwnsFrame(state,{...flow,...input}),false)
  assert.equal(workshop.workshopOwnsFrame({active:6},flow),false)
  assert.equal(workshop.workshopOwnsFrame({active:8},flow),false)
})

test('workshop selection remains usable for continuous restored guide values and invalid inputs',()=>{
  assert.equal(typeof workshop.flowOption,'function')
  for(const [input,expected] of [[-.2,0],[0,0],[.17,0],[.34,1],[.5,1],[.66,1],[.83,2],[1,2],[3,2],[NaN,0]]){
    assert.equal(workshop.flowOption(input),expected)
  }
})

test('scroll reaches the five workshop beats with bounded progress',()=>{
  assert.deepEqual([0,.12,.38,.65,.88].map(flowBeat),[0,1,2,3,4])
  assert.equal(flowProgress(-2),0);assert.equal(flowProgress(2),1)
})
test('replacing scene07 retains navigation and scroll roundtrips',()=>{
  const r={base:13000,atlasStart:2340,atlasLength:8000,machineStart:10340,machineLength:4000,flowStart:21100,flowLength:5200}
  for(const p of [.05,.2,.29,.3,.53,.7,.82,.85,.91,.92,.999]) assert.ok(Math.abs(flowJourneyProgress(flowJourneyPosition(p,r),r)-p)<.00001,`${p}`)
  assert.equal(flowJourneyProgress(r.flowStart,r),.82)
  assert.ok(flowJourneyProgress(r.flowStart+r.flowLength,r)>=.92)
})
test('ownership and distribution are qualitative responses without a winning state',()=>{
  assert.equal(new Set([0,1,2].map(accessResponse)).size,3)
  assert.equal(splitterResponse(-1),splitterResponse(0));assert.equal(splitterResponse(2),splitterResponse(1))
  for(const v of [0,.5,1]) assert.ok(!/đúng|điểm|tốt nhất|%/i.test(splitterResponse(v)))
})
test('cancelled guide practice restores all three physical inputs',()=>{
 const baseline=captureFlowInputs();updateFlow({work:1,access:2,split:0});assert.equal(flowState.work,1)
 restoreFlowInputs(baseline);assert.deepEqual(captureFlowInputs(),baseline)
})

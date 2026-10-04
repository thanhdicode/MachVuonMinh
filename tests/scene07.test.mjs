import test from 'node:test'
import assert from 'node:assert/strict'
import { flowBeat, flowReveal, flowProgress, flowJourneyProgress, flowJourneyPosition, accessResponse, splitterResponse, flowState, updateFlow, captureFlowInputs, restoreFlowInputs } from '../src/experience/scene07State.ts'

test('human stories precede their theory reveals, including reverse scroll',()=>{
  assert.deepEqual([0,.12,.38,.65,.88].map(flowBeat),[0,1,2,3,4])
  for(const p of [.13,.39,.66]) assert.equal(flowReveal(p),false)
  for(const p of [.3,.56,.8,.98]) assert.equal(flowReveal(p),true)
  assert.equal(flowReveal(.2),false)
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

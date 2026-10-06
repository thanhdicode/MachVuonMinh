import assert from 'node:assert/strict'
import { journeyProgress, journeyPosition } from '../src/experience/journey.ts'
import {flowJourneyProgress,flowJourneyPosition} from '../src/experience/scene07State.ts'
const range={base:13000,atlasStart:2340,atlasLength:8000,machineStart:10340,machineLength:4000}
for(const p of [.1,.2,.24,.3,.41,.53,.92]) assert.ok(Math.abs(journeyProgress(journeyPosition(p,range),range)-p)<.00001)
const actualRange={base:16050,atlasStart:2340,atlasLength:8000,machineStart:10340,machineLength:5000}
assert.equal(journeyProgress(actualRange.atlasStart-1,actualRange)<.18,true)
assert.equal(journeyProgress(actualRange.machineStart+actualRange.machineLength,actualRange),.3,'exit is anchored to the actual scene boundary, not a presumed base fraction')
for(const p of [.1,.16,.23,.30,.31,.5,.92])assert.ok(Math.abs(journeyProgress(journeyPosition(p,actualRange),actualRange)-p)<.00001)
const physicalFlow={...actualRange,flowStart:23340,flowLength:6000}
assert.equal(flowJourneyProgress(15340,physicalFlow),.30)
assert.equal(flowJourneyProgress(physicalFlow.flowStart,physicalFlow),.82)
assert.equal(flowJourneyProgress(physicalFlow.flowStart+physicalFlow.flowLength,physicalFlow),.92)
for(const p of [.1,.16,.23,.30,.31,.5,.70,.815,.82,.90,.92,.97])assert.ok(Math.abs(flowJourneyProgress(flowJourneyPosition(p,physicalFlow),physicalFlow)-p)<.00001)

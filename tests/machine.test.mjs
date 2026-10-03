import assert from 'node:assert/strict'
import { machineBeat, machineProgress, journeyProgress, journeyPosition, machineRhythmGain } from '../src/experience/machineState.ts'

// Moving the machine insertion must never skip or repeat Automation.
const range = { base: 13000, atlasStart: 2340, atlasLength: 8000, machineStart: 10340, machineLength: 4000 }
assert.equal(journeyProgress(1300, range), .1)
assert.ok(Math.abs(journeyProgress(6340, range) - .18) < .00001)
assert.ok(Math.abs(journeyProgress(12340, range) - .24) < .00001)
assert.ok(Math.abs(journeyProgress(14340, range) - .30) < .00001)
for (const p of [.1, .2, .24, .3, .41, .53, .92]) assert.ok(Math.abs(journeyProgress(journeyPosition(p, range), range) - p) < .00001, `navigation roundtrip ${p}`)
assert.equal(machineProgress(-1), 0)
assert.equal(machineProgress(2), 1)
assert.deepEqual([0,.045,.13,.24,.52,.65,.78,.865,.95].map(machineBeat),[0,1,2,3,4,5,6,7,8])
assert.equal(machineRhythmGain(10,.6,false),0)
assert.equal(machineRhythmGain(10,.05,true),0)
assert.ok(machineRhythmGain(0,.6,true)>0,'rhythm settles quietly instead of stopping abruptly')
assert.ok(machineRhythmGain(10,.6,true)>machineRhythmGain(0,.6,true))
console.log('Machine checks passed: insertion, navigation and earned reveal boundaries.')

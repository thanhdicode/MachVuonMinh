import assert from 'node:assert/strict'
import test from 'node:test'

import { captureGuidePosition, openedDuringObservation, restoredGuideScrollY } from '../src/onboarding/guideAdapterLogic.ts'
import {flowState,captureFlowInputs,restoreFlowInputs,updateFlow} from '../src/experience/scene07State.ts'

test('Scene07 worker and splitter practice change their inputs and cancelled practice restores the baseline', () => {
  const before=captureFlowInputs()
  updateFlow({work:before.work===1?0:1});assert.notEqual(flowState.work,before.work)
  updateFlow({split:before.split===1?0:1});assert.notEqual(flowState.split,before.split)
  restoreFlowInputs(before);assert.deepEqual(captureFlowInputs(),before)
})

test('modal ownership is claimed only for an opening observed during the guide step', () => {
  assert.equal(openedDuringObservation(false, true), true)
  assert.equal(openedDuringObservation(true, true), false)
  assert.equal(openedDuringObservation(false, false), false)
})

test('outside-Atlas restoration keeps pixels while Atlas restoration keeps logical travel after relayout', () => {
  const outside = captureGuidePosition(640, null, false, 1000, 4000, true)
  assert.equal(restoredGuideScrollY(outside, 2000, 8000, false), 640)

  const atlas = captureGuidePosition(3000, 4, true, 1000, 4000, true)
  assert.equal(atlas.atlasProgress, 0.5)
  assert.equal(restoredGuideScrollY(atlas, 2000, 8000, true), 6000)
  assert.equal(restoredGuideScrollY(atlas, 2000, 8000, false), null)
  assert.equal(restoredGuideScrollY(atlas, null, null, true), null)
  assert.equal(atlas.era, 4)
})

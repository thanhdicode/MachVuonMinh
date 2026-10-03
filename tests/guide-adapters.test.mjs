import assert from 'node:assert/strict'
import test from 'node:test'

import { captureGuidePosition, openedDuringObservation, populatedSlotsChanged, restoredGuideScrollY } from '../src/onboarding/guideAdapterLogic.ts'

test('P01 requires a changed slot layout with at least one populated slot', () => {
  const before = JSON.stringify([1, null, null])
  assert.equal(populatedSlotsChanged(before, [1, null, null]), false)
  assert.equal(populatedSlotsChanged(before, [1, 2, null]), true)
  assert.equal(populatedSlotsChanged(JSON.stringify([null, null, null]), [null, null, null]), false)
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

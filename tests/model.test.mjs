import assert from 'node:assert/strict'
import { labState, installToken, policyResult } from '../src/experience/model.ts'

// Regressions: one-sided mismatch, duplicate/overfilled sockets, generic results.
assert.equal(labState([50,50,50,50,50], [50,50,50]).state, 'fit')
assert.equal(labState([70,70,70,70,70], [50,50,50]).state, 'strain')
assert.equal(labState([95,95,95,95,95], [20,20,20]).state, 'contradiction')
assert.equal(labState([20,20,20,20,20], [95,95,95]).state, 'contradiction')
assert.deepEqual(installToken([0,null,null], 0, 1), [null,0,null])
assert.deepEqual(installToken([0,1,2], 3, 1), [0,3,2])
assert.deepEqual(installToken([0,null,null], 9, 1), [0,null,null])
assert.deepEqual(installToken([0,null,null], 0, NaN), [0,null,null])
assert.deepEqual(installToken([0,null,null], 0, 1.5), [0,null,null])
assert.notEqual(policyResult([0,1,2]).strength, policyResult([3,4,5]).strength)
assert.match(policyResult([0,1,2]).missing, /hạ tầng/i)
console.log('Model checks passed: symmetric mismatch, socket constraints, policy feedback.')

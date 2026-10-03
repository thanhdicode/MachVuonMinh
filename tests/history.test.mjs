import assert from 'node:assert/strict'
import { worldScroll, documentScroll, lensGeometry, historyProgressForTravel } from '../src/experience/historyGeometry.ts'

// Removing the atlas interval must preserve the original chapter progress.
const base = 13000, start = 2340, length = 8000
assert.equal(worldScroll(1300, base, start, length), .1)
assert.ok(Math.abs(worldScroll(start + 4000, base, start, length) - .18) < .00001)
assert.equal(worldScroll(14500, base, start, length), .5)
assert.equal(documentScroll(.1, base, start, length), 1300)
assert.equal(documentScroll(.5, base, start, length), 14500)
assert.equal(worldScroll(base + length, base, start, length), 1)
assert.equal(historyProgressForTravel(0, 100), 0)
assert.equal(historyProgressForTravel(88, 100), .88)
assert.ok(Math.abs(historyProgressForTravel(100, 100) - 1) < 1e-8)
assert.ok(Math.abs(historyProgressForTravel(94, 100) - .94) < 1e-8)
// Exact point: contain letterboxing, non-central pointer and 2.15x zoom.
const lens = lensGeometry({left:100, top:200, width:600, height:500}, 1200, 800, 250, 350)
for (const [key, value] of Object.entries({width:1290, height:860, x:-227.5, y:-120})) assert.ok(Math.abs(lens[key] - value) < 1e-8)
// Left/bottom artwork in the curator composition must magnify the same pointer pixel.
const aligned = lensGeometry({left:100, top:200, width:600, height:500},1200,800,250,350,0,1)
assert.equal(aligned.x,-227.5)
assert.equal(aligned.y,-12.5)
assert.equal(lensGeometry({left:100,top:200,width:600,height:500},800,800,250,350,0,1).x,-227.5)
console.log('History checks passed: insertion mapping, chapter navigation, exact lens coordinates.')

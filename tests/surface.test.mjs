import assert from 'node:assert/strict'
import { createSoilGeometry, brushedMetal, castGrain, bandGeometry, bandDetails } from '../src/experience/surfaceDetail.ts'

const desktop=createSoilGeometry(false),mobile=createSoilGeometry(true)
assert.ok(mobile.attributes.position.count<desktop.attributes.position.count*.6)
for(const geometry of [desktop,mobile,bandGeometry,bandDetails]){
  for(const attribute of Object.values(geometry.attributes))assert.ok(attribute.array.every(Number.isFinite))
  geometry.computeBoundingBox()
  assert.ok(!geometry.boundingBox.isEmpty())
}
assert.ok(desktop.boundingBox.min.y>=-.921 && desktop.boundingBox.max.y<.15)
assert.equal(desktop.attributes.color.count,desktop.attributes.position.count)
for(const texture of [brushedMetal,castGrain]){
  assert.equal(texture.image.data.length,256*256*4)
  assert.equal(texture.generateMipmaps,true)
  assert.equal(texture.colorSpace,'')
}
desktop.dispose();mobile.dispose()
console.log('Surface checks passed: finite geometry, terrain bounds, mobile detail budget, linear data maps.')

import assert from 'node:assert/strict'
import { Vector3 } from 'three'
import { createPropellerGeometry,createRiceGeometry,flightPosition,flightRoute,rotorPositions } from '../src/experience/droneGeometry.ts'

for(const geometry of [createPropellerGeometry(),createRiceGeometry()]){
  for(const attribute of Object.values(geometry.attributes))assert.ok(attribute.array.every(Number.isFinite),'Finite geometry attributes')
  geometry.computeBoundingBox()
  assert.ok(!geometry.boundingBox.isEmpty())
  assert.ok(geometry.attributes.position.count<2500,'Reusable geometry stays within per-instance budget')
  geometry.dispose()
}
assert.equal(rotorPositions.length,4)
assert.equal(new Set(rotorPositions.map(p=>p.join(','))).size,4)
const p=new Vector3(),previous=new Vector3()
for(let frame=0;frame<4800;frame++){
  flightPosition(frame/60,p)
  assert.ok(p.toArray().every(Number.isFinite))
  assert.ok(Math.abs(p.x)<1.3&&p.y>.9&&p.y<1&&Math.abs(p.z)<1.1,'Flight stays above the field')
  if(frame>0)assert.ok(p.distanceTo(previous)<.035,'Flight is continuous, including loop closure')
  previous.copy(p)
}
assert.ok(flightRoute.getPointAt(0).distanceTo(flightRoute.getPointAt(1))<1e-6)
console.log('Drone checks passed: finite shared geometry, four rotors, bounded continuous flight, detail budget.')

import assert from 'node:assert/strict'
import { createLineShaftMechanism } from '../src/experience/lineShaftMechanism.ts'

const mechanism=createLineShaftMechanism()
const shaft=mechanism.root.getObjectByName('line-shaft')
const wheel=mechanism.root.getObjectByName('line-shaft-flywheel')
assert.deepEqual(wheel.position.toArray(),[330,340,40])
assert.deepEqual(shaft.position.toArray(),[910,645,0])

const belts=[1,2,3].map(index=>mechanism.root.getObjectByName(`vertical-belt-${index}`))
assert.equal(belts.filter(Boolean).length,3)
const connections=[[700,440],[1080,570],[1370,365]]
for(let i=0;i<3;i++){
  const top=mechanism.root.getObjectByName(`shaft-pulley-${i+3}`),bottom=mechanism.root.getObjectByName(`driven-pulley-${i+1}`)
  assert.ok(top.position.y-bottom.position.y>top.geometry.parameters.radiusTop+bottom.geometry.parameters.radiusTop,'belt pulleys must not intersect')
}
for(const [index,belt] of belts.entries()){
  belt.geometry.computeBoundingBox()
  const bounds=belt.geometry.boundingBox
  assert.ok(bounds.max.y-bounds.min.y>50,'belt must physically connect shaft and driven pulley')
  assert.equal((bounds.min.x+bounds.max.x)/2,connections[index][0])
  assert.ok(bounds.min.y<=connections[index][1])
  assert.ok(bounds.max.y>=645)
}

const stations=[1,2,3].map(index=>mechanism.root.getObjectByName(`drive-station-${index}`))
mechanism.update(.27,0,1/60)
assert.deepEqual(stations.map(station=>station.visible),[false,false,false])
mechanism.update(.3,0,1/60)
assert.deepEqual(stations.map(station=>station.visible),[true,false,false])
mechanism.update(.4,0,1/60)
assert.deepEqual(stations.map(station=>station.visible),[true,true,false])
mechanism.update(.5,0,1/60)
assert.deepEqual(stations.map(station=>station.visible),[true,true,true])
mechanism.update(.5,0,1/60,true)
assert.deepEqual(stations.map(station=>station.visible),[true,true,false])

const motors=[1,2,3].map(index=>mechanism.root.getObjectByName(`drive-motor-${index}`))
assert.equal(motors.filter(Boolean).length,3)
for(let i=0;i<3;i++){
  assert.equal(motors[i].parent,stations[i],'motor must remain physically attached to owning station')
  assert.ok(motors[i].position.distanceTo(mechanism.root.getObjectByName(`driven-pulley-${i+1}`).position)<100)
}
mechanism.update(.95,0,1/60,false)
assert.ok(motors.every(motor=>motor.visible&&motor.scale.x>0&&motor.scale.x<1),'motors must grow from attached pulley during exit')
mechanism.update(1,0,1/60,true)
assert.deepEqual(motors.map(motor=>motor.visible),[true,true,false])
assert.ok(belts[1].scale.x<1,'compact exit must convert second visible belt')
assert.equal(belts[2].scale.x,1,'hidden third belt must remain leather')
assert.equal(belts[2].position.x,0)

mechanism.update(1,0,1/60,false)
assert.deepEqual(motors.map(motor=>motor.visible),[true,true,true])
assert.equal(belts[1].scale.x,1,'desktop resize must restore second belt')
assert.ok(belts[2].scale.x<1,'desktop exit must convert third belt')
mechanism.update(.9,0,1/60,false)
assert.deepEqual(motors.map(motor=>motor.visible),[false,false,false])
for(let i=0;i<3;i++){
  assert.equal(belts[i].scale.x,1)
  assert.equal(belts[i].position.x,0)
  assert.equal(belts[i].material.color.getHexString(),'68432c')
  assert.equal(belts[i].material.emissive.getHex(),0)
  assert.equal(mechanism.root.getObjectByName(`belt-seam-${i+1}`).visible,true)
}

mechanism.update(.55,1,1/60)
const movingAngle=shaft.rotation.x
for(let i=0;i<240;i++)mechanism.update(.55,0,1/60)
assert.ok(Math.abs(shaft.rotation.x-movingAngle)<.35,'shaft inertia must settle near fixed scroll progress')
const settledAngle=shaft.rotation.x
for(let i=0;i<60;i++)mechanism.update(.55,0,1/60)
assert.ok(Math.abs(shaft.rotation.x-settledAngle)<1e-4,'shaft must stop when scroll stops')

const resources=[]
mechanism.root.traverse(object=>{
  if(object.geometry)resources.push(object.geometry)
  if(object.material)resources.push(...(Array.isArray(object.material)?object.material:[object.material]))
})
const disposed=new Set()
for(const resource of resources){
  resource.addEventListener('dispose',()=>disposed.add(resource))
}
mechanism.dispose()
assert.equal(disposed.size,new Set(resources).size)

console.log('Line-shaft checks passed: three belt connections, phased activation, compact cull, settled inertia, disposal.')

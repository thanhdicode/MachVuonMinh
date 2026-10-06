import { Suspense, useLayoutEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useWorld, timeline } from './WorldState'
import { agedSteel, enamel, brass } from './surfaceDetail'
import { DroneField } from './DroneField'
import { ProductionCar } from './ProductionCar'
import { PeopleModel } from './PeopleModel'
import {usePreparedObject} from './usePreparedObject'

const glass=new THREE.MeshStandardMaterial({color:'#293b39',metalness:.65,roughness:.23})


function FactoryCell() {
  const group=useRef<THREE.Group>(null)
  usePreparedObject(group)
  const arms=useRef<(THREE.Group|null)[]>([])
  const time=useRef(0)
  useFrame((_,delta)=>{
    if(timeline.scene!==6)return
    const state=useWorld.getState()
    if(!state.paused&&!state.reduced)time.current+=Math.min(delta,.05)
    arms.current.forEach((arm,i)=>{if(arm)arm.rotation.z=(i===0?-1:1)*(1.7+Math.sin(time.current*1.5+i)*.1)})
  })
  return <group ref={group} rotation={[.32,-.3,0]}>
    <mesh position-y={-.74} material={glass}><boxGeometry args={[4.4,.15,2.1]}/></mesh>
    {[-.72,.72].map(z=><mesh key={z} position={[0,-.59,z]} material={agedSteel}><boxGeometry args={[4.1,.1,.13]}/></mesh>)}
    {Array.from({length:15},(_,i)=><mesh key={i} position={[-1.96+i*.28,-.6,0]} rotation-x={Math.PI/2} material={agedSteel}><cylinderGeometry args={[.065,.065,1.3,16]}/></mesh>)}
    <group position={[0,-.49,0]} rotation-y={Math.PI/2}><Suspense fallback={null}><ProductionCar/></Suspense></group>
    {[-1,1].map((side,i)=><group key={side} position={[side*1.7,-.58,0]}>
      <mesh position-y={.06} material={agedSteel}><cylinderGeometry args={[.33,.4,.22,40]}/></mesh>
      <group rotation-z={side*.32}>
      <mesh material={enamel} position-y={.5}><capsuleGeometry args={[.13,.75,6,16]}/></mesh>
      <mesh material={brass} position={[0,1,.12]} rotation-x={Math.PI/2}><cylinderGeometry args={[.2,.2,.28,24]}/></mesh>
      <mesh material={agedSteel} position={[0,1,.27]} rotation-x={Math.PI/2}><cylinderGeometry args={[.09,.09,.03,24]}/></mesh>
      <group ref={el=>{arms.current[i]=el}} position-y={1} rotation-z={side*.9}><mesh material={enamel} position-y={.48}><capsuleGeometry args={[.105,.7,6,16]}/></mesh><mesh position-y={.88} material={agedSteel}><cylinderGeometry args={[.14,.14,.13,24]}/></mesh><mesh position-y={1.04} material={brass}><coneGeometry args={[.08,.26,20]}/></mesh></group>
      </group>
    </group>)}
    <group position={[-1.7,-.54,1.08]} scale={.63}><Suspense fallback={null}><PeopleModel/></Suspense></group>
    <mesh position={[-.6,-.4,1]} rotation-x={-.3} material={glass}><boxGeometry args={[.4,.4,.12]}/></mesh>
  </group>
}

function ValueField() {
  const group=useRef<THREE.Group>(null)
  const cells=useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(()=>{
    if(!cells.current)return
    const cell=new THREE.Object3D(),color=new THREE.Color()
    for(let i=0;i<100;i++){
      const digital=i<13,height=.24
      cell.position.set((i%10-4.5)*.35,height/2,(Math.floor(i/10)-4.5)*.35)
      cell.scale.set(.29,height,.29);cell.updateMatrix()
      cells.current.setMatrixAt(i,cell.matrix);cells.current.setColorAt(i,color.set(digital?'#b51f2a':'#bdb3a0'))
    }
    cells.current.instanceMatrix.needsUpdate=true
    if(cells.current.instanceColor)cells.current.instanceColor.needsUpdate=true
    cells.current.computeBoundingSphere()
  },[])
  usePreparedObject(group)
  return <group ref={group} rotation={[.3,-.55,0]}>
    <instancedMesh ref={cells} args={[undefined,undefined,100]}><boxGeometry/><meshStandardMaterial metalness={.45} roughness={.5}/></instancedMesh>
    <mesh position={[-.64535,.244,-1.225]}><boxGeometry args={[.0493,.008,.29]}/><meshStandardMaterial color="#b51f2a" metalness={.45} roughness={.5}/></mesh>
    <mesh position={[0,-.13,0]}><boxGeometry args={[3.65,.12,3.65]}/><meshStandardMaterial color="#51483c" metalness={.6} roughness={.6}/></mesh>
  </group>
}

export function EvidenceObjects() {
  const active=useWorld(s=>s.evidenceCase),mobile=useThree(s=>s.size.width<700)
  return <><DroneField/><group position={active===1?(mobile?[1.52,.75,0]:[2.75,-.2,0]):(mobile?[.12,1.1,0]:[-3.55,-.1,0])} scale={active===1?(mobile?.85:1.3):(mobile?.64:.85)}>
    {active===1&&<FactoryCell/>}
    {active===2&&<ValueField/>}
  </group></>
}

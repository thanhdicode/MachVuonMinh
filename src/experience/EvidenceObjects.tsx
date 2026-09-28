import { useLayoutEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useWorld, timeline } from './WorldState'
import { agedSteel, enamel, brass } from './surfaceDetail'

const carProfile=new THREE.Shape()
carProfile.moveTo(-1.12,-.22)
;[[-1.12,.03],[-.73,.12],[-.38,.48],[.43,.48],[.78,.12],[1.12,.06],[1.12,-.22]].forEach(([x,y])=>carProfile.lineTo(x,y))
carProfile.closePath()
const carBody=new THREE.ExtrudeGeometry(carProfile,{depth:.86,bevelEnabled:true,bevelSize:.045,bevelThickness:.045,bevelSegments:3,steps:1})
carBody.translate(0,0,-.43)
const glass=new THREE.MeshStandardMaterial({color:'#293b39',metalness:.65,roughness:.23})
const rubber=new THREE.MeshStandardMaterial({color:'#252927',roughness:.85})

export function DigitalNode({kind}:{kind:number}) {
  return <group rotation={[.12,-.2,0]}>
    {kind===0&&[0,1,2].map(i=><mesh key={i} position-y={i*.16} material={agedSteel}><cylinderGeometry args={[.3,.3,.1,32]}/></mesh>)}
    {kind===1&&<><mesh material={enamel}><boxGeometry args={[.62,.12,.62]}/></mesh><mesh position-y={.09} material={agedSteel}><boxGeometry args={[.4,.06,.4]}/></mesh>{[-1,1].flatMap(side=>Array.from({length:5},(_,i)=><group key={`${side}-${i}`}><mesh position={[side*.4,0,(i-2)*.11]} material={brass}><boxGeometry args={[.16,.025,.035]}/></mesh><mesh position={[(i-2)*.11,0,side*.4]} material={brass}><boxGeometry args={[.035,.025,.16]}/></mesh></group>))}</>}
    {kind===2&&<><mesh material={agedSteel}><boxGeometry args={[.48,.8,.38]}/></mesh>{[0,1,2,3].map(i=><mesh key={i} position={[0,-.26+i*.18,.2]} material={enamel}><boxGeometry args={[.34,.065,.025]}/></mesh>)}</>}
    {kind===3&&<><mesh position-y={.32} material={brass}><sphereGeometry args={[.17,24,16]}/></mesh><mesh position-y={-.02} material={agedSteel}><capsuleGeometry args={[.19,.2,8,20]}/></mesh><mesh position={[.2,0,.21]} rotation={[.1,.1,-.3]} material={enamel}><boxGeometry args={[.32,.24,.045]}/></mesh></>}
  </group>
}

function FactoryCell() {
  const arms=useRef<(THREE.Group|null)[]>([])
  useFrame(({clock})=>{
    if(timeline.scene!==6)return
    const state=useWorld.getState(),t=state.paused||state.reduced?0:clock.elapsedTime
    arms.current.forEach((arm,i)=>{if(arm)arm.rotation.z=(i===0?-1:1)*(.95+Math.sin(t*1.5+i)*.14)})
  })
  return <group rotation={[.32,-.3,0]}>
    <mesh position-y={-.74} material={glass}><boxGeometry args={[4.4,.15,2.1]}/></mesh>
    {[-.72,.72].map(z=><mesh key={z} position={[0,-.59,z]} material={agedSteel}><boxGeometry args={[4.1,.1,.13]}/></mesh>)}
    {Array.from({length:15},(_,i)=><mesh key={i} position={[-1.96+i*.28,-.6,0]} rotation-x={Math.PI/2} material={agedSteel}><cylinderGeometry args={[.065,.065,1.3,16]}/></mesh>)}
    <group position={[0,-.2,0]}>
      <mesh geometry={carBody} material={agedSteel}/>
      {[-1,1].map(side=><group key={side}>
        <mesh position={[.02,.29,side*.481]} material={glass}><boxGeometry args={[.83,.23,.012]}/></mesh>
        <mesh position={[.02,.29,side*.49]} material={agedSteel}><boxGeometry args={[.04,.25,.025]}/></mesh>
        <mesh position={[side*1.12,-.025,0]} material={brass}><boxGeometry args={[.025,.07,.65]}/></mesh>
      </group>)}
      {[-.72,.72].flatMap(x=>[-.5,.5].map(z=><group key={`${x}-${z}`} position={[x,-.2,z]} rotation-x={Math.PI/2}>
        <mesh material={rubber}><cylinderGeometry args={[.24,.24,.15,40]}/></mesh>
        <mesh material={agedSteel}><cylinderGeometry args={[.15,.15,.16,32]}/></mesh>
        <mesh material={brass}><cylinderGeometry args={[.048,.048,.17,20]}/></mesh>
      </group>))}
    </group>
    {[-1,1].map((side,i)=><group key={side} position={[side*1.7,-.58,0]}>
      <mesh position-y={.06} material={agedSteel}><cylinderGeometry args={[.33,.4,.22,40]}/></mesh>
      <group rotation-z={side*.32}>
      <mesh material={enamel} position-y={.5}><capsuleGeometry args={[.13,.75,6,16]}/></mesh>
      <mesh material={brass} position={[0,1,.12]} rotation-x={Math.PI/2}><cylinderGeometry args={[.2,.2,.28,24]}/></mesh>
      <mesh material={agedSteel} position={[0,1,.27]} rotation-x={Math.PI/2}><cylinderGeometry args={[.09,.09,.03,24]}/></mesh>
      <group ref={el=>{arms.current[i]=el}} position-y={1} rotation-z={side*.9}><mesh material={enamel} position-y={.48}><capsuleGeometry args={[.105,.7,6,16]}/></mesh><mesh position-y={.88} material={agedSteel}><cylinderGeometry args={[.14,.14,.13,24]}/></mesh><mesh position-y={1.04} material={brass}><coneGeometry args={[.08,.26,20]}/></mesh></group>
      </group>
    </group>)}
    <group position={[-1.15,-.15,.96]} scale={.55}><DigitalNode kind={3}/></group>
    <mesh position={[-.6,-.4,1]} rotation-x={-.3} material={glass}><boxGeometry args={[.4,.4,.12]}/></mesh>
  </group>
}

function ValueField() {
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
  return <group rotation={[.3,-.55,0]}>
    <instancedMesh ref={cells} args={[undefined,undefined,100]}><boxGeometry/><meshStandardMaterial metalness={.45} roughness={.5}/></instancedMesh>
    <mesh position={[-.64535,.244,-1.225]}><boxGeometry args={[.0493,.008,.29]}/><meshStandardMaterial color="#b51f2a" metalness={.45} roughness={.5}/></mesh>
    <mesh position={[0,-.13,0]}><boxGeometry args={[3.65,.12,3.65]}/><meshStandardMaterial color="#51483c" metalness={.6} roughness={.6}/></mesh>
  </group>
}

export function EvidenceObjects() {
  const active=useWorld(s=>s.evidenceCase),mobile=useThree(s=>s.size.width<700)
  return <group position={mobile?[.12,1.1,0]:[-3.55,-.1,0]} scale={mobile?.64:.85}>
    {active===1&&<FactoryCell/>}
    {active===2&&<ValueField/>}
  </group>
}

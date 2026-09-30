import { Suspense, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { timeline, useWorld } from './WorldState'
import { agedSteel, enamel, brass } from './surfaceDetail'
import { PeopleModel } from './PeopleModel'

const routes = [
  [[-3.05,.28,-.8],[-2.7,.28,-.8],[-2.3,.28,-.8]],
  [[-1.6,.28,-.8],[-.8,.28,-.8],[.1,.28,-.8],[.6,.28,-.8]],
  [[1.9,.28,-.8],[2.35,.28,-.5],[2.35,.28,.9],[1.8,.28,1.25],[.25,.28,1.25]],
  [[-.9,.28,1.25],[-2.5,.28,1.25],[-3.1,.28,1.8],[-4.8,-.9,2.6],[-12,-2.5,3]],
]

export function DataField() {
  const active=useWorld(s=>s.active), mobile=useThree(s=>s.size.width<700)
  const packets=useRef<THREE.InstancedMesh>(null), assembly=useRef<THREE.Group>(null), time=useRef(0)
  const curves=useMemo(()=>routes.map(points=>new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)))),[])
  const dummy=useMemo(()=>new THREE.Object3D(),[])
  const count=32
  useFrame((_,delta)=>{
    if((timeline.scene!==4&&!(timeline.scene===3&&timeline.local>.72))||!packets.current)return
    const exit=timeline.scene===4?THREE.MathUtils.smoothstep(timeline.local,.72,1):0
    assembly.current?.scale.setScalar((mobile?.78:1)*Math.max(.001,1-exit*2))
    const state=useWorld.getState()
    if(!state.paused&&!state.reduced)time.current+=Math.min(delta,.05)
    for(let i=0;i<count;i++){
      curves[i%curves.length].getPoint((Math.floor(i/4)/8+time.current*.11)%1,dummy.position)
      dummy.scale.setScalar(.035);dummy.updateMatrix();packets.current.setMatrixAt(i,dummy.matrix)
    }
    packets.current.instanceMatrix.needsUpdate=true
  })
  const caption=(position:[number,number,number],title:string,detail:string)=>active===4&&<Html center position={position} zIndexRange={[5,4]} pointerEvents="none"><div className="node-caption"><strong>{title}</strong><small>{detail}</small></div></Html>
  return <group ref={assembly} position={mobile?[1.05,-1.8,0]:[2.35,-.55,0]} scale={mobile?.78:1} rotation={[.55,-.3,-.045]}>
    <RoundedBox args={[6.2,.42,3.8]} radius={.14} smoothness={4} material={enamel} position-y={-.07}/>
    <RoundedBox args={[6.08,.12,3.68]} radius={.04} smoothness={4} position-y={.18}>
      <meshStandardMaterial color="#343b36" roughness={.64} metalness={.55}/>
    </RoundedBox>
    {[-2.88,2.88].flatMap(x=>[-1.66,1.66].map(z=><mesh key={`${x}-${z}`} position={[x,.255,z]} material={brass}><cylinderGeometry args={[.055,.055,.025,6]}/></mesh>))}
    {Array.from({length:13},(_,i)=><mesh key={i} position={[.9+i*.12,-.08,1.908]}><boxGeometry args={[.055,.15,.014]}/><meshStandardMaterial color="#211b1b" roughness={.8}/></mesh>)}
    {[-2.3,2.3].flatMap(x=>[-1.2,1.2].map(z=><mesh key={`${x}-${z}`} position={[x,-.38,z]} material={agedSteel}><cylinderGeometry args={[.2,.24,.24,24]}/></mesh>))}
    {[0,1,2].map(i=><group key={i} position={[0,.247,-1.25-i*.16]}>
      <mesh position-x={-.4} material={brass}><boxGeometry args={[1.8,.008,.012]}/></mesh>
      <mesh position={[-1.3,0,0]} material={brass}><cylinderGeometry args={[.035,.035,.009,12]}/></mesh>
    </group>)}
    <mesh position={[-3.04,.28,-.8]} rotation-z={Math.PI/2} material={brass}><cylinderGeometry args={[.065,.065,.13,16]}/></mesh>
    {curves.map((curve,i)=><mesh key={i}><tubeGeometry args={[curve,64,.032,8,false]}/><meshStandardMaterial color="#cf3540" roughness={.45} metalness={.3}/></mesh>)}
    <instancedMesh ref={packets} args={[undefined,undefined,count]} frustumCulled={false}><sphereGeometry args={[1,8,8]}/><meshBasicMaterial color="#ffe5b0"/></instancedMesh>

    <group position={[-1.95,.3,-.8]}>
      <mesh material={enamel}><cylinderGeometry args={[.56,.62,.12,48]}/></mesh>
      {[0,1,2,3].map(i=><group key={i} position-y={.18+i*.19}>
        <mesh material={agedSteel}><cylinderGeometry args={[.48,.48,.14,48]}/></mesh>
        <mesh position-y={.035} material={brass}><cylinderGeometry args={[.485,.485,.012,48]}/></mesh>
        <mesh position={[0,0,.48]}><sphereGeometry args={[.028,10,8]}/><meshBasicMaterial color="#f4d49b"/></mesh>
      </group>)}
      {caption([0,1.32,0],'DỮ LIỆU','NGUYÊN LIỆU MỚI')}
    </group>

    <group position={[1.25,.34,-.8]}>
      <RoundedBox args={[1.5,.13,1.3]} radius={.06} smoothness={3} material={enamel}/>
      {[-1,1].flatMap(side=>Array.from({length:8},(_,i)=><group key={`${side}-${i}`}>
        <mesh position={[side*.83,0,(i-3.5)*.14]} material={brass}><boxGeometry args={[.2,.035,.06]}/></mesh>
        <mesh position={[(i-3.5)*.16,0,side*.73]} material={brass}><boxGeometry args={[.065,.035,.2]}/></mesh>
      </group>))}
      <RoundedBox args={[1.1,.16,.88]} radius={.035} smoothness={3} position-y={.14} material={agedSteel}/>
      {Array.from({length:6},(_,i)=><mesh key={i} position={[(i-2.5)*.16,.29,0]} material={agedSteel}><boxGeometry args={[.075,.2,.74]}/></mesh>)}
      {caption([0,1.28,0],'AI / THUẬT TOÁN','CÔNG CỤ XỬ LÝ')}
    </group>

    <group position={[-.3,.3,1.15]}>
      <RoundedBox args={[1.15,.24,.64]} radius={.05} smoothness={3} position-y={.13} material={agedSteel}/>
      <group position={[0,.37,-.11]} rotation-x={-.4}>
        <RoundedBox args={[.93,.52,.09]} radius={.035} smoothness={3} material={enamel}/>
        <mesh position-z={.05}><planeGeometry args={[.8,.39]}/><meshStandardMaterial color="#1b2927" roughness={.4}/></mesh>
        {[.15,.32,.24,.39,.29,.43].map((h,i)=><mesh key={i} position={[-.3+i*.12,-.15+h*.3,.058]}><planeGeometry args={[.05,h*.6]}/><meshBasicMaterial color="#d5be8b"/></mesh>)}
      </group>
      <group position={[-1.06,0,.08]} scale={.76} rotation-y={.45}><Suspense fallback={null}><PeopleModel sceneIndex={4}/></Suspense></group>
      {caption([-.75,-.13,.95],'CON NGƯỜI','LÀM CHỦ CÔNG NGHỆ')}
    </group>
    {caption([1.8,-.28,2.16],'HẠ TẦNG SỐ','NỀN TẢNG KẾT NỐI')}
  </group>
}

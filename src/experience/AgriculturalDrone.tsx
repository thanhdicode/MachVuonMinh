import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { timeline, useWorld } from './WorldState'
import { agedSteel, brass, enamel, brushedMetal } from './surfaceDetail'
import { createPropellerGeometry, rotorPositions } from './droneGeometry'

const carbon=new THREE.MeshStandardMaterial({color:'#202b2d',metalness:.55,roughness:.38,roughnessMap:brushedMetal})
const tank=new THREE.MeshStandardMaterial({color:'#e9e7d8',roughness:.33,metalness:.06})
const lens=new THREE.MeshPhysicalMaterial({color:'#152d33',metalness:.65,roughness:.16,clearcoat:1})
const propeller=createPropellerGeometry()
const rod=new THREE.CylinderGeometry(1,1,1,20)
const axis=new THREE.Vector3(0,1,0)

export function Strut({from,to,radius=.04,material=carbon}:{from:[number,number,number];to:[number,number,number];radius?:number;material?:THREE.Material}) {
  const pose=useMemo(()=>{
    const start=new THREE.Vector3(...from),end=new THREE.Vector3(...to),direction=end.clone().sub(start)
    return {position:start.add(end).multiplyScalar(.5),quaternion:new THREE.Quaternion().setFromUnitVectors(axis,direction.clone().normalize()),length:direction.length()}
  },[...from,...to])
  return <mesh geometry={rod} material={material} position={pose.position} quaternion={pose.quaternion} scale={[radius,pose.length,radius]} dispose={null}/>
}

export function AgriculturalDrone() {
  const root=useRef<THREE.Group>(null),mixer=useRef<THREE.AnimationMixer>(null)
  useEffect(()=>{
    if(!root.current)return
    const animation=new THREE.AnimationMixer(root.current)
    const tracks=rotorPositions.map((_,i)=>new THREE.NumberKeyframeTrack(`rotor${i}.rotation[y]`,[0,1.2],[i*.7,i*.7+(i%2?-1:1)*Math.PI*2]))
    const clip=new THREE.AnimationClip('rotors',1.2,tracks)
    animation.clipAction(clip).play();mixer.current=animation
    return()=>{animation.stopAllAction();animation.uncacheRoot(animation.getRoot());mixer.current=null}
  },[])
  useFrame((_,delta)=>{
    const state=useWorld.getState()
    if(timeline.scene===6&&state.evidenceCase===0&&state.farmStage>0&&!state.paused&&!state.reduced)mixer.current?.update(Math.min(delta,.05))
  })
  return <group ref={root} dispose={null}>
    <RoundedBox args={[.98,.23,1.22]} radius={.1} smoothness={5} material={carbon}/>
    <RoundedBox args={[.94,.18,.85]} radius={.07} smoothness={5} position={[0,.17,.12]} material={enamel}/>
    <RoundedBox args={[.63,.2,.73]} radius={.045} smoothness={4} position={[0,.31,-.13]} material={carbon}/>
    <RoundedBox args={[.31,.05,.46]} radius={.018} smoothness={3} position={[0,.425,-.13]} material={agedSteel}/>
    {[-.32,.32].map(x=><Strut key={x} from={[x,.23,-.32]} to={[x,.23,.45]} radius={.028} material={agedSteel}/>)}
    <RoundedBox args={[.87,.66,.87]} radius={.17} smoothness={6} position={[0,-.43,.04]} material={tank}/>
    <mesh position={[0,-.8,.02]} rotation-y={Math.PI/4} material={tank}><cylinderGeometry args={[.5,.27,.26,4,1]}/></mesh>
    <mesh position={[0,-.25,.51]} rotation-x={Math.PI/2} material={carbon}><cylinderGeometry args={[.095,.095,.08,32]}/></mesh>
    {[-1,1].map(side=><group key={side}>
      <RoundedBox args={[.055,.47,.79]} radius={.024} smoothness={3} position={[side*.43,-.45,.04]} material={agedSteel}/>
      <mesh position={[side*.24,-.64,.487]} material={agedSteel}><boxGeometry args={[.028,.23,.018]}/></mesh>
      <Strut from={[side*.38,-.08,-.39]} to={[side*.69,-1.12,-.53]} radius={.038}/>
      <Strut from={[side*.38,-.08,.42]} to={[side*.69,-1.12,.57]} radius={.038}/>
      <Strut from={[side*.69,-1.12,-.76]} to={[side*.69,-1.12,.82]} radius={.044}/>
      <mesh position={[side*.71,-.74,.38]} material={enamel}><cylinderGeometry args={[.11,.11,.18,24]}/></mesh>
      <Strut from={[side*.25,-.82,.15]} to={[side*.71,-.74,.38]} radius={.025}/>
      <mesh position={[side*.71,-.87,.38]} material={agedSteel}><cylinderGeometry args={[.14,.1,.055,32]}/></mesh>
      <mesh position={[side*.3,.06,.623]}><boxGeometry args={[.15,.045,.015]}/><meshBasicMaterial color="#e2b871"/></mesh>
    </group>)}
    <group position={[0,-.035,.68]}>
      <RoundedBox args={[.46,.21,.19]} radius={.06} smoothness={4} material={carbon}/>
      {[-.12,.12].map(x=><group key={x} position={[x,0,.095]} rotation-x={Math.PI/2}>
        <mesh material={agedSteel}><cylinderGeometry args={[.071,.071,.035,28]}/></mesh>
        <mesh position-y={.022} material={lens}><cylinderGeometry args={[.047,.047,.012,28]}/></mesh>
      </group>)}
    </group>
    {rotorPositions.map(([x,y,z],i)=><group key={i}>
      <Strut from={[Math.sign(x)*.36,0,Math.sign(z)*.35]} to={[x,y,z]} radius={.067}/>
      <Strut from={[Math.sign(x)*.42,.035,Math.sign(z)*.43]} to={[x*.77,y*.77,z*.77]} radius={.026} material={agedSteel}/>
      <mesh position={[x*.42,.06,z*.5]} rotation-z={Math.PI/2} material={enamel}><cylinderGeometry args={[.11,.11,.12,24]}/></mesh>
      <group position={[x,y,z]}>
        <mesh material={carbon}><cylinderGeometry args={[.18,.16,.23,40]}/></mesh>
        <mesh position-y={.08} material={agedSteel}><cylinderGeometry args={[.184,.184,.025,40]}/></mesh>
        <mesh position-y={.135} material={enamel}><cylinderGeometry args={[.135,.15,.04,32]}/></mesh>
        <group name={`rotor${i}`} position-y={.17} rotation-y={i*.7}>
          <mesh geometry={propeller} material={carbon}/><mesh geometry={propeller} material={carbon} rotation-y={Math.PI}/>
          <mesh material={agedSteel}><cylinderGeometry args={[.085,.085,.05,24]}/></mesh>
          <mesh position-y={.03} material={brass}><cylinderGeometry args={[.028,.028,.018,6]}/></mesh>
        </group>
      </group>
    </group>)}
  </group>
}

if(import.meta.hot)import.meta.hot.dispose(()=>{carbon.dispose();tank.dispose();lens.dispose();propeller.dispose();rod.dispose()})

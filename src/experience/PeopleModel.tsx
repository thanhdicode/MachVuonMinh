import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { prepareCharacter } from './characterModel'
import { timeline, useWorld } from './WorldState'
import { enamel, agedSteel } from './surfaceDetail'
import {usePreparedObject} from './usePreparedObject'

export function PeopleModel({manual=false,farmer=false,sceneIndex=6}:{manual?:boolean;farmer?:boolean;sceneIndex?:number}) {
  const source=useGLTF('/models/farmer.glb')
  const holder=useRef<THREE.Group>(null),tool=useRef<THREE.Group>(null),handPosition=useMemo(()=>new THREE.Vector3(),[])
  const pose=useMemo(()=>({origin:new THREE.Vector3(),direction:new THREE.Vector3(),target:new THREE.Vector3(),rotation:new THREE.Quaternion(),parent:new THREE.Quaternion(),correction:new THREE.Quaternion()}),[])
  const model=useMemo(()=>prepareCharacter(source.scene,farmer),[source.scene,farmer])
  usePreparedObject(model.object)
  const mixer=useMemo(()=>new THREE.AnimationMixer(model.object),[model.object]),previous=useRef<THREE.AnimationAction|null>(null)
  useEffect(()=>{
    const clip=source.animations.find(a=>a.name===(manual?'Walk':'Idle_Neutral'))
    if(!clip)return
    const action=mixer.clipAction(clip)
    previous.current?.fadeOut(.25);action.reset().fadeIn(.25).play();previous.current=action
    if(useWorld.getState().reduced||useWorld.getState().paused)mixer.update(.3)
  },[manual,mixer,source.animations])
  useEffect(()=>()=>{mixer.stopAllAction();mixer.uncacheRoot(model.object);model.object.traverse(node=>{if(node instanceof THREE.Mesh){node.geometry.dispose();(node.material as THREE.Material).dispose()}})},[model,mixer])
  useFrame((_,delta)=>{
    const state=useWorld.getState()
    if(timeline.scene===sceneIndex&&!state.paused&&!state.reduced)mixer.update(Math.min(delta,.05)*(manual?.65:1))
    if(!holder.current||timeline.scene!==sceneIndex)return
    holder.current.updateMatrixWorld(true)
    const aim=(boneName:string,childName:string,x:number,y:number,z:number)=>{
      const bone=model.object.getObjectByName(boneName),child=model.object.getObjectByName(childName)
      if(!bone||!child||!bone.parent)return
      bone.getWorldPosition(pose.origin);child.getWorldPosition(pose.direction).sub(pose.origin).normalize()
      holder.current!.localToWorld(pose.target.set(x,y,z)).sub(pose.origin).normalize()
      pose.correction.setFromUnitVectors(pose.direction,pose.target)
      bone.getWorldQuaternion(pose.rotation).premultiply(pose.correction)
      bone.parent.getWorldQuaternion(pose.parent).invert()
      bone.quaternion.copy(pose.parent.multiply(pose.rotation));bone.updateMatrixWorld(true)
    }
    aim('LowerArmR','WristR',-.15,1.03,.38)
    if(!manual)aim('LowerArmL','WristL',.1,1.03,.38)
    const wrist=model.object.getObjectByName('WristR')
    if(wrist&&holder.current&&tool.current){wrist.getWorldPosition(handPosition);holder.current.worldToLocal(handPosition);tool.current.position.copy(handPosition)}
  })
  return <group ref={holder}>
    <group scale={model.scale} position-y={-model.bottom*model.scale}><primitive object={model.object}/></group>
    {manual?<group position={[0,1.04,-.085]}>
      <RoundedBox args={[.28,.43,.16]} radius={.045} smoothness={4} material={enamel}/>
      <mesh position-y={.24} material={agedSteel}><cylinderGeometry args={[.065,.065,.035,24]}/></mesh>
      {[-.11,.11].map(x=><mesh key={x}><tubeGeometry args={[new THREE.CatmullRomCurve3([new THREE.Vector3(x,-.1,.1),new THREE.Vector3(x,.33,.23),new THREE.Vector3(x,.36,.06),new THREE.Vector3(x,.1,-.09)]),16,.012,5,false]}/><meshStandardMaterial color="#31362b" roughness={.9}/></mesh>)}
    </group>:null}
    <group ref={tool}>
      {manual?<mesh name="sprayer-wand" rotation={[Math.PI/3,0,-.65]} position={[.18,-.12,.14]} material={agedSteel}><cylinderGeometry args={[.012,.012,.57,12]}/></mesh>:<group position={[.1,0,.03]} rotation={[.3,0,0]}><RoundedBox args={[.28,.045,.19]} radius={.012} material={enamel}/><mesh position-y={.025} rotation-x={-Math.PI/2}><planeGeometry args={[.2,.12]}/><meshStandardMaterial color="#182c30" roughness={.3}/></mesh></group>}
    </group>
  </group>
}

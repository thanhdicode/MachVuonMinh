import { Suspense, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { AgriculturalDrone, Strut } from './AgriculturalDrone'
import { createRiceGeometry, flightPosition, flightRoute } from './droneGeometry'
import { enamel } from './surfaceDetail'
import { timeline, useWorld } from './WorldState'
import { PeopleModel } from './PeopleModel'
import { PaddyGround } from './PaddyGround'

const riceGeometry=createRiceGeometry()
const riceMaterial=new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.88})
const windTime={value:0}
riceMaterial.onBeforeCompile=shader=>{
  shader.uniforms.windTime=windTime
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float windTime;').replace('#include <begin_vertex>','#include <begin_vertex>\n#ifdef USE_INSTANCING\ntransformed.x += sin(windTime * 1.3 + instanceMatrix[3].x * 1.4 + instanceMatrix[3].z) * position.y * position.y * .13;\n#endif')
}

const flightPath=new THREE.CatmullRomCurve3(flightRoute.points.map(p=>new THREE.Vector3(p.x,-1.37,p.z)),true,'catmullrom',.14)

export function DroneField() {
  const active=useWorld(s=>s.evidenceCase),stage=useWorld(s=>s.farmStage)
  const mobile=useThree(s=>s.size.width<700)
  const aircraft=useRef<THREE.Group>(null),operator=useRef<THREE.Group>(null),assembly=useRef<THREE.Group>(null)
  const rice=useRef<THREE.InstancedMesh>(null),mist=useRef<THREE.InstancedMesh>(null),route=useRef<THREE.Mesh>(null),shadow=useRef<THREE.Mesh>(null)
  const clock=useRef(0),blend=useRef(stage===0?0:1)
  const matrix=useMemo(()=>new THREE.Object3D(),[]),point=useMemo(()=>new THREE.Vector3(),[])
  const nozzles=useMemo(()=>[new THREE.Vector3(),new THREE.Vector3()],[])
  const manualNozzle=useMemo(()=>new THREE.Vector3(),[])
  const rows=mobile?20:26,columns=mobile?28:38,sprayCount=mobile?120:240
  useLayoutEffect(()=>{
    if(!rice.current)return
    for(let z=0;z<rows;z++)for(let x=0;x<columns;x++){
      const px=-2.65+x/(columns-1)*5.3+Math.sin(x*31+z*17)*.033,pz=-1.35+z/(rows-1)*2.7+Math.cos(z*41+x*19)*.025
      const path=Math.abs(px)<.17||Math.abs(pz-.08)<.12
      matrix.position.set(px,-1.69,pz);matrix.rotation.set(0,(x*3.1+z*1.7)%6.28,0)
      matrix.scale.setScalar(path?0:.62+((x*17+z*11)%13)/22);matrix.updateMatrix()
      rice.current.setMatrixAt(z*columns+x,matrix.matrix)
    }
    rice.current.instanceMatrix.needsUpdate=true;rice.current.computeBoundingSphere()
  },[rows,columns,matrix])
  useFrame((_,delta)=>{
    const s=useWorld.getState()
    if(s.evidenceCase!==0||(timeline.scene!==6&&!(timeline.scene===5&&timeline.local>.72))||!aircraft.current||!operator.current||!mist.current)return
    const moving=!s.paused&&!s.reduced,dt=Math.min(delta,.05)
    if(moving)clock.current+=dt
    const t=clock.current
    windTime.value=t
    blend.current=moving?THREE.MathUtils.damp(blend.current,stage===0?0:1,6,dt):stage===0?0:1
    const b=blend.current
    flightPosition(t,point)
    if(mobile)point.x*=.55
    aircraft.current.position.set(point.x*b,-1.7+(point.y+1.7)*b,point.z)
    aircraft.current.scale.setScalar(b*(mobile?1.02:1.13))
    aircraft.current.rotation.set(.03*Math.sin(t*.7)*b,-.12+Math.sin(t*.22)*.09,-.02*Math.cos(t*.32))
    aircraft.current.updateMatrix()
    nozzles.forEach((v,i)=>v.set(i?.71:-.71,-.9,.38).applyMatrix4(aircraft.current!.matrix))
    operator.current.position.set(stage===0?Math.sin(t*.27)*1.5:-2.6,-1.7,stage===0?.1:1.75)
    operator.current.rotation.y=stage===0?(Math.cos(t*.27)>0?Math.PI/2:-Math.PI/2):-.35
    if(stage===0&&assembly.current){
      const wand=operator.current.getObjectByName('sprayer-wand')
      if(wand){wand.updateWorldMatrix(true,false);wand.localToWorld(manualNozzle.set(0,-.285,0));assembly.current.worldToLocal(manualNozzle)}
    }
    if(route.current){route.current.visible=stage>0;route.current.scale.x=mobile?.55:1}
    if(shadow.current){shadow.current.visible=stage>0;shadow.current.position.set(point.x,-1.35,point.z);shadow.current.scale.set(2.4,1.8,1)}
    for(let i=0;i<sprayCount;i++){
      const u=(i/sprayCount+t*.52)%1,angle=i*2.39996,r=.035+u*.5
      if(stage===0){
        matrix.position.set(manualNozzle.x+Math.cos(angle)*u*.22,THREE.MathUtils.lerp(manualNozzle.y,-1.55,u),manualNozzle.z+Math.sin(angle)*u*.22)
      }else{
        const nozzle=nozzles[i%2]
        matrix.position.set(nozzle.x+Math.cos(angle)*r,THREE.MathUtils.lerp(nozzle.y,-1.55,u),nozzle.z+Math.sin(angle)*r)
      }
      matrix.rotation.set(0,0,0);matrix.scale.set(.006+u*.007,.022,.006+u*.007);matrix.updateMatrix();mist.current.setMatrixAt(i,matrix.matrix)
    }
    mist.current.instanceMatrix.needsUpdate=true
    if(assembly.current){const exit=timeline.scene===6?THREE.MathUtils.smoothstep(timeline.local,.72,1):0;assembly.current.scale.setScalar((mobile?.8:.9)*Math.max(.001,1-exit*2))}
  })
  return <group visible={active===0} position={mobile?[1.53,-.25,0]:[2.55,0,0]}>
    <group ref={assembly} scale={mobile?.8:.9} rotation={[.3,-.32,0]}>
      <Suspense fallback={null}><PaddyGround/></Suspense>
      <instancedMesh ref={rice} args={[riceGeometry,riceMaterial,rows*columns]} dispose={null}/>
      <mesh ref={shadow} rotation-x={-Math.PI/2}>
        <planeGeometry args={[1,1]}/>
        <shaderMaterial transparent depthWrite={false} vertexShader={'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }'} fragmentShader={'varying vec2 vUv; void main(){float a=1.-smoothstep(.04,.5,length(vUv-.5));gl_FragColor=vec4(.12,.14,.06,a*.24);}'}/>
      </mesh>
      <mesh ref={route}><tubeGeometry args={[flightPath,180,.012,5,true]}/><meshStandardMaterial color="#b51f2a" roughness={.6}/></mesh>
      <group ref={aircraft}><AgriculturalDrone/></group>
      <group ref={operator}><Suspense fallback={null}><PeopleModel farmer={stage===0} manual={stage===0}/></Suspense></group>
      <instancedMesh ref={mist} args={[undefined,undefined,sprayCount]} frustumCulled={false}><sphereGeometry args={[1,6,6]}/><meshBasicMaterial color="#718b76" transparent opacity={.5} depthWrite={false}/></instancedMesh>
      {stage===2&&<group>
        {[-.6,1.8].map(x=><group key={x} position={[x,-1.67,1.7]} scale={.88}><Suspense fallback={null}><PeopleModel farmer={x>0}/></Suspense></group>)}
        <Strut from={[-2.6,-1.63,1.78]} to={[2,-1.63,1.78]} radius={.023} material={enamel}/>
      </group>}
    </group>
  </group>
}

if(import.meta.hot)import.meta.hot.dispose(()=>{riceGeometry.dispose();riceMaterial.dispose()})

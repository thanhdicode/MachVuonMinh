import { Component, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import { easing } from 'maath'
import { timeline, useWorld } from './WorldState'
import { labState } from './model'
import { brushedMetal, castGrain, createSoilGeometry, bandGeometry, bandDetails, enamel, agedSteel, brass } from './surfaceDetail'
import { EvidenceObjects } from './EvidenceObjects'
import { DataField } from './DataField'
import { MachineRenderer } from './MachineRenderer'
import { Scene07Renderer } from './Scene07Renderer'

const RED = '#B51F2A', IVORY = '#F3E8D0'
export const backgrounds = ['#f0e9da', '#d6c5a6', '#191b1c', '#deded3', '#21151a', '#201e1b', '#efe9dc', '#201e1b', '#eee7d8']
const centers = [0, 2.2, 2.2, 2.3, 1.4, 0, 2, 0, 2.5]
const cameraPath = new THREE.CatmullRomCurve3(Array.from({ length: 9 }, (_, i) => new THREE.Vector3(0, .25, 12 - i * 24)), false, 'catmullrom', .1)
const lookPath = new THREE.CatmullRomCurve3(Array.from({ length: 9 }, (_, i) => new THREE.Vector3(0, 0, -i * 24)), false, 'catmullrom', .1)
const point = new THREE.Vector3(), target = new THREE.Vector3(), color = new THREE.Color(), nextColor = new THREE.Color()

function CameraRig() {
  const { camera, scene, size, gl, invalidate, setDpr } = useThree()
  const smooth = useRef(0)
  useEffect(()=>setDpr(size.width<768?1:Math.min(devicePixelRatio,1.5)),[size.width,setDpr])
  useEffect(() => { const refresh = () => invalidate(); window.addEventListener('scroll',refresh); const unsub = useWorld.subscribe(refresh); return()=>{window.removeEventListener('scroll',refresh);unsub()} },[invalidate])
  useEffect(() => {
    const refreshDrag = () => { if (timeline.scene === 0 && !useWorld.getState().unlocked) invalidate() }
    const events = ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'lostpointercapture'] as const
    events.forEach(event => window.addEventListener(event, refreshDrag))
    return () => events.forEach(event => window.removeEventListener(event, refreshDrag))
  }, [invalidate])
  useFrame((_, delta) => {
    const state = useWorld.getState(), transition = THREE.MathUtils.smoothstep(timeline.local, .72, 1)
    const progress = Math.min(8, timeline.scene + transition) / 8
    smooth.current = state.reduced || state.paused ? progress : THREE.MathUtils.damp(smooth.current, progress, 8, delta)
    cameraPath.getPoint(smooth.current, point); lookPath.getPoint(smooth.current, target)
    if (!state.reduced && timeline.scene < 8) {
      point.z -= Math.sin(Math.min(1, timeline.local / .72) * Math.PI / 2) * .8 * (1-transition)
      point.x += Math.sin(timeline.local * Math.PI) * .16
    }
    if (size.width < 700) { point.z += 4; point.y += 1; target.y += .6 }
    if (timeline.scene === 2 && !state.reduced) { const throughHub = Math.sin(transition * Math.PI) * 2.35; point.x += throughHub; target.x += throughHub }
    if (!state.reduced) { point.x += timeline.pointer[0] * .12; point.y += timeline.pointer[1] * .08 }
    camera.position.copy(point); camera.lookAt(target)
    color.set(backgrounds[timeline.scene]).lerp(nextColor.set(backgrounds[Math.min(8, timeline.scene + 1)]), transition)
    if(state.machine)color.set('#151614')
    if(timeline.scene===3 && timeline.local<.2) color.set('#151614').lerp(nextColor.set(backgrounds[3]),THREE.MathUtils.smoothstep(timeline.local,0,.2))
    scene.background = color
    if (scene.fog instanceof THREE.Fog) scene.fog.color.copy(color)
    gl.setClearColor(color)
  })
  return null
}

export function Tube({ points, radius = .035, color = RED }: { points: number[][]; radius?: number; color?: string }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p[0],p[1],p[2]))), [points])
  return <mesh><tubeGeometry args={[curve, 128, radius, 10, false]} /><meshStandardMaterial color={color} roughness={color===RED?.65:.88} metalness={color===RED?.08:.02} bumpMap={castGrain} bumpScale={color===RED?.002:.012}/></mesh>
}

function ThreadSegment({ index }: { index: number }) {
  const unlocked=useWorld(s=>s.unlocked)
  const mobile=useThree(s=>s.size.width<700)
  const endpoint = useRef<THREE.Mesh>(null), group = useRef<THREE.Group>(null)
  const curve = useMemo(() => {
    const x = centers[index]
    const points = index === 0 ? [[-9,-3.8,1],[-4,-2.6,1],[0,-1.6,1],[2.35,-.75,.8],[3.1,.45,0],[2.9,1.3,-.8],[4.2,2,-1.5],[12,3,-3],[20,2,-10]]
      : index === 1 ? [[-7,-2,4],[-1,-1.65,2],[2,-1.5,0],[3,-1.3,-3],[1,-.8,-8],[0,0,-24]]
      : index === 2 ? [[-8,-3,3],[x-3,-2.3,1],[x+2.2,-1.5,.6],[x+2.6,1.3,.2],[x+.1,2.8,-.2],[x-2.5,1.4,0],[x-2.8,-1.5,.2],[x-1,-2.7,-2],[0,0,-24]]
      : index === 3 ? [[-8,-2,3],[-1,-2,.4],[2,-1.7,.3],[4,-.8,0],[4,1.5,-1],[1,2,-4],[0,0,-24]]
      : index === 5 ? [[-9,-3.5,1],[-4,-3.2,1],[-2.8,-2,1],[-2.5,.6,0],[-1.6,2.2,-1],[1,2.5,-1],[2.8,.5,-2],[1,-2.2,0],[-1,-1,1],[0,0,-24]]
      : index === 8 ? [[-8,-4,4],[-3,-3.6,1],[1,-3,0],[x+2,-1.8,0],[x+3,1,0],[x+1,2.6,-1],[x-2,1,0],[x-1,-1.5,1],[x+2,-.8,-1],[x+5,2,-10]]
      : [[-8,-2,4],[-3,-1,2],[x-2,1.8,0],[x+1,2.5,-1],[x+3,.5,-2],[x+1,-2.2,0],[x-1,-1,1],[0,0,-24]]
    return new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p[0],p[1],p[2])))
  }, [index])
  useFrame(({ clock }, delta) => {
    if (!group.current) return
    group.current.visible = ![1,2,3,4,6].includes(index) && (index !== 0 || unlocked) && (timeline.scene === index || (timeline.scene + 1 === index && timeline.local > .72))
    if (!group.current.visible || !endpoint.current) return
    const state = useWorld.getState()
    const t = state.reduced || state.paused ? .22 : (clock.elapsedTime * .075) % .8
    curve.getPoint(t, point)
    easing.damp3(endpoint.current.position, point, .08, delta)
  })
  return <group ref={group} position={[mobile?(index===0?-1.8:-centers[index]*.65):0,mobile?(index===5?2.2:index===7?1.2:0):0,-index*24]} scale={mobile?.65:1}>
    <mesh><tubeGeometry args={[curve, mobile?240:400, index === 0 ? .038 : .028, 10, false]} /><meshStandardMaterial color={RED} roughness={.72} metalness={.08} /></mesh>
    <mesh ref={endpoint}><sphereGeometry args={[.038, 12, 12]} /><meshBasicMaterial color={IVORY} /></mesh>
  </group>
}

function IntroCord() {
  const mesh=useRef<THREE.Mesh>(null),{camera,size}=useThree(),endpoint=useMemo(()=>new THREE.Vector3(-1.5,-.9,0),[])
  const ray=useMemo(()=>new THREE.Raycaster(),[]),plane=useMemo(()=>new THREE.Plane(new THREE.Vector3(0,0,1),0),[]),last=useRef('')
  useFrame((_,delta)=>{if(!mesh.current)return;mesh.current.visible=timeline.scene===0&&!useWorld.getState().unlocked;if(!mesh.current.visible)return
    const mobile=size.width<700
    const ndc=timeline.dragging?new THREE.Vector2(...timeline.endpoint):new THREE.Vector2(mobile?-.3:-.2,mobile?-.02:-.18)
    ray.setFromCamera(ndc,camera);ray.ray.intersectPlane(plane,target)
    if(useWorld.getState().reduced||useWorld.getState().paused)endpoint.copy(target)
    else easing.damp3(endpoint,target,.055,delta)
    const key=endpoint.toArray().map(n=>n.toFixed(3)).join(',');if(key===last.current)return;last.current=key
    const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-10,-3,1),new THREE.Vector3(-5,-2.3,0),new THREE.Vector3(endpoint.x-1.5,endpoint.y-.45,.05),endpoint.clone()])
    mesh.current.geometry.dispose();mesh.current.geometry=new THREE.TubeGeometry(curve,64,.038,8,false)
  })
  return <mesh ref={mesh}><tubeGeometry/><meshStandardMaterial color={RED} roughness={.36} metalness={.35}/></mesh>
}

function RadialMarks({radius,count=64}: {radius:number;count?:number}) {
  const mesh=useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(()=>{
    if(!mesh.current)return
    const mark=new THREE.Object3D()
    for(let i=0;i<count;i++){
      const angle=i/count*Math.PI*2
      mark.position.set(Math.cos(angle)*radius,Math.sin(angle)*radius,0)
      mark.rotation.z=angle;mark.scale.set(i%8===0?2:1,1,1);mark.updateMatrix()
      mesh.current.setMatrixAt(i,mark.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate=true
    mesh.current.computeBoundingSphere()
  },[radius,count])
  return <instancedMesh ref={mesh} args={[undefined,undefined,count]}><boxGeometry args={[.023,.005,.006]}/><meshBasicMaterial color="#39423e"/></instancedMesh>
}

function Intro() {
  const eyelet = useRef<THREE.Group>(null)
  const mobile=useThree(s=>s.size.width<700)
  const unlocked = useWorld(s => s.unlocked)
  useFrame((_, delta) => {
    if (!eyelet.current || timeline.scene > 1) return
    const still=useWorld.getState().reduced || useWorld.getState().paused
    const x=unlocked?(mobile?0:2.8):.55
    if(still){eyelet.current.rotation.y=unlocked?-.55:-.35;eyelet.current.position.x=x}
    else {easing.damp(eyelet.current.rotation, 'y', unlocked ? -.55 : -.35, .6, delta);easing.damp(eyelet.current.position, 'x', x, .8, delta)}
  })
  const profile=useMemo(()=>[[1.46,-.36],[1.46,.06],[1.5,.15],[1.66,.15],[1.69,.28],[2.14,.28],[2.2,.21],[2.2,-.18],[2.13,-.28],[1.64,-.28],[1.6,-.36],[1.46,-.36]].map(p=>new THREE.Vector2(...p as [number,number])),[])
  return <group ref={eyelet} position={[.55,.15,0]} rotation={[.28,-.35,-.22]}>
    <mesh rotation-x={Math.PI/2}><latheGeometry args={[profile,160]}/><meshStandardMaterial color="#949a90" metalness={.9} roughness={.6} roughnessMap={brushedMetal} bumpMap={brushedMetal} bumpScale={.007}/></mesh>
    {[1.52,1.7,1.77,2.07,2.13].map((r,i)=><mesh key={r} position-z={i===0?.145:.286}><torusGeometry args={[r,.009,6,128]}/><meshStandardMaterial color={i%2?'#343e3e':'#bac2bd'} metalness={.86} roughness={.48}/></mesh>)}
    {Array.from({length:8},(_,i)=>{const a=i/8*Math.PI*2;return <group key={i} position={[Math.cos(a)*1.92,Math.sin(a)*1.92,.29]} rotation-z={a}><mesh rotation-x={Math.PI/2}><cylinderGeometry args={[.087,.087,.035,32]}/><meshStandardMaterial color="#323d3f" metalness={.8} roughness={.45}/></mesh><mesh position-z={.022}><boxGeometry args={[.095,.017,.005]}/><meshBasicMaterial color="#141c1d"/></mesh></group>})}
    <group position-z={.24}><RadialMarks radius={2.16}/></group>
    <mesh position-z={-.3}><torusGeometry args={[1.5,.046,12,100]}/><meshStandardMaterial color="#293331" metalness={.6} roughness={.6}/></mesh>
    <mesh position={[0,-.1,-.9]}><ringGeometry args={[1.5,2.35,100]}/><meshBasicMaterial color="#7f7767" transparent opacity={.07} side={THREE.DoubleSide}/></mesh>
  </group>
}

function SceneGroup({ index, children }: { index: number; children: ReactNode }) {
  const group = useRef<THREE.Group>(null), { size } = useThree()
  useFrame(() => { if (group.current) group.current.visible = timeline.scene === index || (timeline.scene + 1 === index && timeline.local > .72) })
  const mobile = size.width < 700
  const mobileY=index===5?2.2:index===7?1.4:index===1?-.55:index===2?-.4:index===3?.2:index===8?-.3:.6
  const mobileScale=index===5?.62:index===7?.6:index===1?.7:index===2?.75:index===3?.72:.85
  return <group ref={group} position={[mobile && index !== 0 ? -centers[index] * (index===3?.75:.65) : 0, mobile ? mobileY : 0, -index * 24]} scale={mobile ? mobileScale : 1}>{children}</group>
}

function Agrarian() {
  const blade = useRef<THREE.Group>(null)
  const mobile=useThree(s=>s.size.width<700),stones=useRef<THREE.InstancedMesh>(null)
  const surface=useMemo(()=>createSoilGeometry(mobile),[mobile])
  useEffect(()=>()=>surface.dispose(),[surface])
  const shape = useMemo(()=>{const s=new THREE.Shape();s.moveTo(-.15,.8);s.bezierCurveTo(-.6,.35,-1.1,.15,-1.2,-.65);s.quadraticCurveTo(.1,-1.15,1.1,-.6);s.quadraticCurveTo(.3,-.25,-.15,.8);return s},[])
  useLayoutEffect(()=>{
    if(!stones.current)return
    const pebble=new THREE.Object3D(),tint=new THREE.Color()
    for(let i=0;i<55;i++){
      pebble.position.set(Math.sin(i*14.37)*3.65,.06,Math.cos(i*5.17)*2.45)
      pebble.rotation.set(i,i*.7,0);pebble.scale.setScalar(.025+(i%4)*.011);pebble.updateMatrix()
      stones.current.setMatrixAt(i,pebble.matrix);stones.current.setColorAt(i,tint.set(i%2?'#654a32':'#90704b'))
    }
    stones.current.instanceMatrix.needsUpdate=true
    if(stones.current.instanceColor)stones.current.instanceColor.needsUpdate=true
    stones.current.computeBoundingSphere()
  },[])
  useFrame((_,delta)=>{if(blade.current && timeline.scene===1) easing.damp(blade.current.rotation,'z',-.2+THREE.MathUtils.smoothstep(timeline.local,.7,1)*1.2,.3,delta)})
  return <group position={[2.3,-.1,0]} rotation={[.3,-.42,.03]}>
    <group position={[.15,-1.8,-.8]} rotation-z={-.055} scale={.92}>
      <mesh geometry={surface}><meshStandardMaterial vertexColors roughness={1} bumpMap={castGrain} bumpScale={.065}/></mesh>
      <instancedMesh ref={stones} args={[undefined,undefined,55]}><dodecahedronGeometry args={[1,0]}/><meshStandardMaterial roughness={1}/></instancedMesh>
    </group>
    <group ref={blade} position={[.3,-.75,.6]} rotation={[.15,.2,-.2]}>
      <mesh><extrudeGeometry args={[shape,{depth:.14,curveSegments:48,bevelEnabled:true,bevelSegments:4,bevelSize:.055,bevelThickness:.04}]} /><meshStandardMaterial color="#66706a" metalness={.8} roughness={.68} roughnessMap={brushedMetal} bumpMap={castGrain} bumpScale={.014}/></mesh>
      <Tube points={[[0,-.2,0],[.13,.6,-.1],[.5,1.2,-.25],[1.7,1.55,-.7],[3.7,1.5,-1.3]]} radius={.12} color="#695039"/>
      <Tube points={[[0,.35,0],[-.5,1.25,.2],[-1,2.65,.35],[-1.6,2.9,.4]]} radius={.095} color="#4f3b2b"/>
      <mesh position={[.1,.35,.12]} rotation-z={-.2}><boxGeometry args={[.26,.6,.09]}/><meshStandardMaterial color="#424a46" metalness={.7} roughness={.6}/></mesh>
      {[-.4,.3].map(y=><mesh key={y} position={[.08,y,.22]}><sphereGeometry args={[.058,12,12]}/><meshStandardMaterial color="#a3a89b" metalness={.8} roughness={.5}/></mesh>)}
    </group>
    <Tube radius={.025} points={[[-14,-1.65,6],[-4,-1.64,2.8],[.1,-1.6,.5],[.35,-1.65,-2],[.6,-1.65,-5],[0,0,-24]]}/>
  </group>
}

function Joint({ radius=.36 }: {radius?:number}) { return <group rotation-x={Math.PI/2}>
  <mesh><cylinderGeometry args={[radius,radius,.55,48]}/><meshStandardMaterial color="#505853" metalness={.88} roughness={.55} roughnessMap={brushedMetal}/></mesh>
  <mesh position-y={.3}><cylinderGeometry args={[radius*.66,radius*.66,.07,48]}/><meshStandardMaterial color={RED} metalness={.5} roughness={.48}/></mesh>
  <mesh position-y={.295} rotation-x={Math.PI/2}><torusGeometry args={[radius*.84,.017,8,48]}/><meshStandardMaterial color="#c4b98c" metalness={.85} roughness={.4}/></mesh>
  <mesh position-y={.345}><cylinderGeometry args={[radius*.22,radius*.22,.03,6]}/><meshStandardMaterial color="#bfc2b8" metalness={.9} roughness={.35}/></mesh>
</group> }
function RobotArm() {
  const shoulder=useRef<THREE.Group>(null), elbow=useRef<THREE.Group>(null), wrist=useRef<THREE.Group>(null)
  const workpieces=useRef<THREE.Group>(null),production=useRef(0)
  useFrame(({clock},delta)=>{if(timeline.scene!==3)return;const s=useWorld.getState(),a=s.automation/100,t=s.reduced||s.paused?0:clock.elapsedTime
    const rotate=(group:THREE.Group|null,angle:number)=>{if(!group)return;if(s.reduced||s.paused)group.rotation.z=angle;else easing.damp(group.rotation,'z',angle,.3,delta)}
    rotate(shoulder.current,-.42+Math.sin(t*.65)*.13*a);rotate(elbow.current,-1.1+a*.32+Math.sin(t*.65+1)*.18*a);rotate(wrist.current,-.4+a*.3)
    if(!s.reduced&&!s.paused)production.current+=delta*a*.45
    workpieces.current?.children.forEach((part,i)=>{part.position.x=-1.7+(i*.82+production.current)%4.9})
  })
  return <group position={[2,-1.7,0]} rotation={[0,-.25,0]}>
    <mesh position-y={-.45}><cylinderGeometry args={[1.05,1.2,.32,64]}/><meshStandardMaterial color="#444b4c" metalness={.85} roughness={.3}/></mesh>
    <mesh position-y={-.15}><cylinderGeometry args={[.5,.75,.45,48]}/><meshStandardMaterial color="#d6d7c9" metalness={.65} roughness={.25}/></mesh>
    <Tube radius={.025} points={[[-13,-1.1,1],[-3,-.8,1],[-.8,-.25,.55],[0,0,.34]]}/>
    <group ref={workpieces}>{Array.from({length:6},(_,i)=><group key={i} position={[-1.7+i*.82,-.4,1.3]}><mesh><cylinderGeometry args={[.17,.2,.24,24]}/><meshStandardMaterial color="#5e6968" metalness={.78} roughness={.45}/></mesh><mesh rotation-x={Math.PI/2} position-y={.125}><torusGeometry args={[.11,.012,6,24]}/><meshStandardMaterial color="#b4bcb4" metalness={.8} roughness={.4}/></mesh></group>)}</group>
    <group ref={shoulder} rotation-z={-.42}><Joint radius={.43}/><mesh position-y={1.1}><capsuleGeometry args={[.26,1.5,8,24]}/><meshStandardMaterial color="#d3d5c8" metalness={.65} roughness={.28}/></mesh><Tube radius={.025} points={[[0,0,.34],[-.33,.35,.34],[-.33,1.8,.34],[0,2.15,.34]]}/>
      <group ref={elbow} position-y={2.15} rotation-z={-.9}><Joint/><mesh position-y={.95}><capsuleGeometry args={[.22,1.35,8,24]}/><meshStandardMaterial color="#d3d5c8" metalness={.7} roughness={.25}/></mesh><Tube radius={.022} points={[[0,0,.34],[-.28,.3,.34],[-.28,1.55,.34],[0,1.85,.34]]}/>
        <group ref={wrist} position-y={1.85}><Joint radius={.27}/><Tube radius={.018} points={[[0,0,.34],[.13,.25,.29],[.13,.58,.25],[.24,.75,.18]]}/><mesh position-y={.4}><cylinderGeometry args={[.16,.24,.5,24]}/><meshStandardMaterial color="#7a807d" metalness={.85} roughness={.25}/></mesh>{[-1,1].map(x=><group key={x} position={[x*.2,.75,0]} rotation-z={-x*.25}><mesh><boxGeometry args={[.1,.6,.22]}/><meshStandardMaterial color="#303a3c" metalness={.8} roughness={.3}/></mesh></group>)}</group>
      </group>
    </group>
    <mesh position={[.7,-.74,-.6]}><boxGeometry args={[5.8,.17,3.8]}/><meshStandardMaterial color="#828d87" metalness={.55} roughness={.35}/></mesh>
    {Array.from({length:12},(_,i)=><mesh key={i} position={[-1.8+i*.45,-.62,.4]} rotation-x={Math.PI/2}><cylinderGeometry args={[.09,.09,2,12]}/><meshStandardMaterial color="#b1b5aa" metalness={.8} roughness={.3}/></mesh>)}
  </group>
}

function PressureBand({ ivory=false }: {ivory?:boolean}) {
  return <group dispose={null}>
    <mesh geometry={bandGeometry} material={ivory?agedSteel:enamel}/>
    <mesh geometry={bandDetails} material={brass}/>
  </group>
}

function DialecticCore({policy=false}: {policy?:boolean}) {
  const slots=useWorld(s=>s.slots)
  const core=useRef<THREE.Mesh>(null), cage=useRef<THREE.Group>(null), packets=useRef<THREE.InstancedMesh>(null)
  const object=useMemo(()=>new THREE.Object3D(),[])
  const deformation=useMemo(()=>({value:0}),[]), time=useMemo(()=>({value:0}),[])
  const baseRotation=useRef(0)
  useFrame(({clock},delta)=>{
    if(timeline.scene!==(policy?7:5))return
    const s=useWorld.getState(), model=labState(s.forces,s.relations), gap=policy?Math.max(0,.5-s.slots.filter(x=>x!==null).length*.15):Math.abs(model.gap), t=s.reduced||s.paused?0:clock.elapsedTime
    time.value=t;deformation.value=.06+gap*.21
    const elapsed=(Date.now()-s.reconfigure)/1000, reassembly=!policy&&elapsed<1.8&&!s.reduced?Math.sin(elapsed/1.8*Math.PI):0
    if(core.current){const scale=policy?1.5:1.25+model.force*1.15;if(s.reduced||s.paused)core.current.scale.setScalar(scale);else easing.damp3(core.current.scale,[scale,scale,scale],.25,delta);core.current.rotation.y=t*.08}
    if(cage.current){baseRotation.current+=s.reduced||s.paused?0:delta*.3;cage.current.rotation.y=-.3+Math.sin(baseRotation.current)*.16
      cage.current.children.forEach((plate,i)=>{const angle=i/12*Math.PI*2, strain=-gap*.25+(i%3===0?gap*.5:0), spread=reassembly*.18;const r=2.48+strain+spread;const position:[number,number,number]=[Math.cos(angle)*r,Math.sin(angle)*r,Math.sin(i*1.7)*(gap*.5+reassembly*.45)];if(s.reduced||s.paused)plate.position.set(...position);else easing.damp3(plate.position,position,.15,delta);plate.rotation.z=angle+Math.PI/2+(i%2===0?gap*.35:-gap*.25)+reassembly*.35;plate.rotation.y=(i%2===0?.1:-.1)+reassembly*Math.PI*.3})
    }
    if(packets.current){for(let i=0;i<90;i++){const blocked=gap>.38,a=blocked?i/90*.85+t*.08:i/90*Math.PI*2+t*.4;object.position.set(Math.cos(a)*(2.1+gap*.4),Math.sin(a)*(2.1+gap*.4),Math.sin(a*2)*.8);object.scale.setScalar(blocked?.045:.025);object.updateMatrix();packets.current.setMatrixAt(i,object.matrix)}packets.current.instanceMatrix.needsUpdate=true}
  })
  return <group position={[0,.1,0]} rotation={[.14,0,-.12]} scale={policy?.85:.9}>
    <mesh ref={core} scale={1.7}><sphereGeometry args={[1,80,56]}/><meshStandardMaterial color="#e8d8b6" metalness={.12} roughness={.38} onBeforeCompile={shader=>{
      shader.uniforms.uTime=time;shader.uniforms.uDeform=deformation
      shader.vertexShader='uniform float uTime; uniform float uDeform;\n'+shader.vertexShader
      shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>',`#include <beginnormal_vertex>
        vec3 phase = position * vec3(5.0, 4.0, 4.0) + uTime * vec3(1.0, -0.7, 0.4);
        vec3 sn = sin(phase), cs = cos(phase);
        float offset = sn.x * cs.y * sn.z * uDeform;
        vec3 gradient = vec3(5.0*cs.x*cs.y*sn.z, -4.0*sn.x*sn.y*sn.z, 4.0*sn.x*cs.y*cs.z) * uDeform;
        objectNormal = normalize(normal - (gradient - normal * dot(normal, gradient)) / (1.0 + offset));`)
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','vec3 transformed = position * (1.0 + offset);')
    }}/></mesh>
    <group ref={cage} rotation={[.12,-.3,0]}>{Array.from({length:12},(_,i)=><group key={i}>
      <PressureBand/>
    </group>)}</group>
    {[0,1,2].map(i=><mesh key={i} rotation={[Math.PI/2+i*.25,i*Math.PI/3,.2]}><torusGeometry args={[2.38,.018,6,96]}/><meshStandardMaterial color="#9e4444" metalness={.7} roughness={.3}/></mesh>)}
    <instancedMesh ref={packets} args={[undefined,undefined,90]} frustumCulled={false}><icosahedronGeometry args={[1,0]}/><meshBasicMaterial color="#ecb77a"/></instancedMesh>
    <mesh rotation={[.25,.15,0]} position-z={-.7}><torusGeometry args={[3.16,.009,4,120]}/><meshBasicMaterial color="#818177" transparent opacity={.24}/></mesh>
    {policy&&slots.filter((n):n is number=>n!==null).map(n=><mesh key={n} rotation={[n*.41,.4+n*.51,n*.3]}><torusGeometry args={[2.8+n*.045,.024,8,96]}/><meshBasicMaterial color={n%2===0?'#dfbd76':'#f18c83'}/></mesh>)}
  </group>
}

function Synthesis() {
  const structure=useRef<THREE.Group>(null)
  useFrame(({clock},delta)=>{if(timeline.scene!==8||!structure.current)return;const s=useWorld.getState(),t=s.reduced||s.paused?0:clock.elapsedTime;structure.current.rotation.y=-.5+Math.sin(t*.25)*.2;structure.current.children.forEach((part,i)=>{const a=i/10*Math.PI*2;const radius=2.25+Math.sin(t*.5+i*.35)*.13;const position:[number,number,number]=[Math.cos(a)*radius,Math.sin(a)*radius,0];if(s.reduced||s.paused)part.position.set(...position);else easing.damp3(part.position,position,.3,delta);part.rotation.z=a+Math.PI/2})})
  return <group ref={structure} position={[2.6,.1,0]} rotation={[.3,-.5,-.25]}>{Array.from({length:10},(_,i)=><group key={i}><PressureBand ivory/></group>)}</group>
}

function World() {
  return <>
    <fog attach="fog" args={['#eadcbe', 18, 38]} />
    <ambientLight intensity={.65} />
    <directionalLight position={[-4,8,8]} intensity={2.4} color="#fff6e7" />
    <directionalLight position={[6,2,-3]} intensity={1.45} color="#dfe7e7" />
    <Environment resolution={128} frames={1}>
      <Lightformer intensity={4} position={[0,5,-5]} scale={[12,6,1]} />
      <Lightformer intensity={2} position={[-5,1,3]} rotation={[0,Math.PI/2,0]} scale={[8,3,1]} />
      <Lightformer intensity={1.5} position={[5,-2,2]} rotation={[0,-Math.PI/2,0]} scale={[10,2,1]} />
    </Environment>
    <CameraRig />
    <group name="persistent-red-thread">{Array.from({length:9},(_,i)=><ThreadSegment key={i} index={i}/>)}</group>
    <IntroCord/>
    <SceneGroup index={0}><Intro /></SceneGroup>
    <SceneGroup index={1}><Agrarian /></SceneGroup>
    <MachineRenderer/>
    <SceneGroup index={3}><RobotArm /></SceneGroup>
    <SceneGroup index={4}><DataField /></SceneGroup>
    <SceneGroup index={5}><DialecticCore /></SceneGroup>
    <SceneGroup index={6}><EvidenceObjects/></SceneGroup>
    <Scene07Renderer/>
    <SceneGroup index={8}><Synthesis/></SceneGroup>
  </>
}

function ContextWatch({ onLost }: { onLost: () => void }) {
  const { gl } = useThree()
  useEffect(()=>{ const canvas=gl.domElement; const lost=(e:Event)=>{e.preventDefault();onLost()}; canvas.addEventListener('webglcontextlost',lost); return()=>canvas.removeEventListener('webglcontextlost',lost) },[gl,onLost])
  return null
}

class CanvasBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}
export default function WorldCanvas({ suspended = false }: { suspended?: boolean }) {
  const [lost, setLost] = useState(false)
  const [hidden,setHidden]=useState(document.hidden)
  const [compact,setCompact]=useState(innerWidth<768)
  useEffect(()=>{const change=()=>setHidden(document.hidden);document.addEventListener('visibilitychange',change);return()=>document.removeEventListener('visibilitychange',change)},[])
  useEffect(()=>{const media=matchMedia('(max-width:767px)'),change=()=>setCompact(media.matches);media.addEventListener('change',change);return()=>media.removeEventListener('change',change)},[])
  const reduced = useWorld(s => s.reduced), paused = useWorld(s => s.paused), history = useWorld(s => s.history), machine = useWorld(s => s.machine), flow = useWorld(s => s.active===7)
  useEffect(() => { const move = (e: PointerEvent) => { timeline.pointer = [e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2] }; window.addEventListener('pointermove',move); return()=>window.removeEventListener('pointermove',move) },[])
  const fallback = <div className="world-fallback" aria-label="Sơ đồ sợi đỏ thay cho không gian 3D"><svg viewBox="0 0 1000 700">{flow?<><path d="M-30 550C210 550 270 360 420 400S600 610 750 450S930 490 1030 560" fill="none" stroke="#B51F2A" strokeWidth="10"/><path d="M290 500C300 670 500 650 510 530M510 530C700 670 880 670 800 490" fill="none" stroke="#B51F2A" strokeWidth="4"/></>:<><path d="M-100 650C300 650 800 50 800 350S100 650 400 200S1100 500 1200 0" fill="none" stroke="#B51F2A" strokeWidth="8"/><circle cx="620" cy="330" r="170" fill="none" stroke="#817c6c" strokeWidth="28"/></>}</svg><span>Chế độ đồ họa nhẹ</span></div>
  return <div className="world-canvas" aria-hidden="true"><CanvasBoundary fallback={fallback}>{lost ? fallback : <Canvas dpr={[1, compact ? 1 : 1.5]} camera={{ position:[0,.25,12], fov:42, near:.1, far:45 }} gl={{ antialias:true, powerPreference:'high-performance' }} frameloop={hidden || suspended || history || (machine && (reduced || compact)) || (flow && (reduced || compact))?'never':reduced || paused ? 'demand' : 'always'} fallback={fallback}><ContextWatch onLost={()=>setLost(true)}/><World /></Canvas>}</CanvasBoundary></div>
}



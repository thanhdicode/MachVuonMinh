import {useEffect,useRef} from 'react'
import {useFrame,useThree} from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import {createValueFlow} from './valueFlowGeometry'
import {flowState,workshopOwnsFrame} from './scene07State'
import {useWorld} from './WorldState'
import {prepareScene} from './prepareScene'

// The workshop uses the existing WebGL renderer and owns its scene lifecycle.
function createExhibit(environment:THREE.Texture|null){
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(42,1,.1,40)
    scene.background=new THREE.Color('#f3e8d0');camera.position.set(0,0,15)
    const value=createValueFlow();scene.add(value.root)
    const key=new THREE.DirectionalLight('#fff4df',3.2);key.position.set(-1,7,7)
    key.castShadow=true;key.shadow.mapSize.set(1024,1024)
    Object.assign(key.shadow.camera,{left:-6,right:6,top:6,bottom:-5,near:.1,far:24})
    key.shadow.camera.updateProjectionMatrix()
    key.shadow.bias=-.0003;key.shadow.normalBias=.035
    key.shadow.autoUpdate=false
    const rim=new THREE.DirectionalLight('#e1eaf4',2.5);rim.position.set(6,4,-4)
    scene.add(key,key.target,rim,new THREE.HemisphereLight('#fff8e9','#766a59',.5))
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(11,7),new THREE.ShadowMaterial({opacity:.14,depthWrite:false}))
    floor.rotation.x=-Math.PI/2;floor.position.y=-.9;floor.receiveShadow=true;value.root.add(floor)
    // Reuse the host's prepared lighting texture; no second PMREM capture on entry.
    scene.environment=environment;scene.environmentIntensity=.85
    const materials=new Map<THREE.Material,{opacity:number;transparent:boolean;depthWrite:boolean}>()
    value.root.traverse(o=>{if(o instanceof THREE.Mesh)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.set(m,{opacity:m.opacity,transparent:m.transparent,depthWrite:m.depthWrite}))})
    return {scene,camera,value,key,materials,background:scene.background,shadowState:'',layoutState:'',alpha:-1}
}
function setFade(exhibit:ReturnType<typeof createExhibit>,alpha:number){
  exhibit.materials.forEach((base,m)=>{m.opacity=base.opacity*alpha;m.transparent=base.transparent||alpha<.999;m.depthWrite=base.depthWrite&&alpha>.999})
  exhibit.scene.background=alpha>.999?exhibit.background:null
  exhibit.alpha=alpha
}
export function Scene07Renderer(){
  const {gl,scene:hostScene,size,invalidate}=useThree()
  const exhibitRef=useRef<ReturnType<typeof createExhibit>|null>(null)
  const stageRef=useRef<HTMLElement|null>(null)
  const preload=useWorld(s=>s.active===6||s.active===7)
  useEffect(()=>{
    if(!preload)return
    let cancelled=false
    const exhibit=createExhibit(hostScene.environment),stage=document.querySelector<HTMLElement>('.flow-stage')
    stageRef.current=stage
    flowState.renderReady=false;exhibitRef.current=exhibit
    if(stage)stage.dataset.renderReady='false'
    const compile=()=>{
      const shadowEnabled=gl.shadowMap.enabled;gl.shadowMap.enabled=true
      try{return prepareScene(gl,exhibit.scene,exhibit.camera)}finally{gl.shadowMap.enabled=shadowEnabled}
    }
    // Compile both transition and opaque variants before the first visible draw.
    void (async()=>{
      setFade(exhibit,.5);await compile();if(cancelled)return
      setFade(exhibit,1);await compile();if(cancelled)return
      flowState.renderReady=true;if(stage)stage.dataset.renderReady='true';invalidate()
    })().catch(error=>{if(!cancelled)console.error('Workshop shader preparation failed',error)})
    return()=>{cancelled=true;flowState.renderReady=false;exhibitRef.current=null;if(stage)delete stage.dataset.renderReady;exhibit.value.dispose();exhibit.key.shadow.dispose()}
  },[gl,hostScene,invalidate,preload])
  useEffect(()=>{let prev='';const follow=()=>{const s=useWorld.getState();if(s.active!==7)return;const next=`${flowState.progress}/${flowState.revision}/${size.width}`;if(prev!==next){prev=next;invalidate()}};gsap.ticker.add(follow);return()=>gsap.ticker.remove(follow)},[invalidate,size.width])
  useFrame((_,delta)=>{
    const s=useWorld.getState();if(s.active!==7||flowState.static)return
    const exhibit=exhibitRef.current;if(!exhibit||!flowState.renderReady)return
    const aspect=size.width/size.height,compact=size.width<1100,p=flowState.progress
    const layoutState=`${size.width}/${size.height}`
    if(exhibit.layoutState!==layoutState){
      exhibit.camera.aspect=aspect;exhibit.camera.updateProjectionMatrix();exhibit.camera.lookAt(0,0,0)
      const viewHeight=2*15*Math.tan(THREE.MathUtils.degToRad(21))
      exhibit.value.root.position.set(viewHeight*aspect*.225,-viewHeight*.015,0)
      exhibit.value.root.scale.setScalar(Math.min(viewHeight*aspect*.053,compact?.62:.92))
      exhibit.key.target.position.copy(exhibit.value.root.position);exhibit.layoutState=layoutState
    }
    exhibit.value.update(p,delta,s.paused||s.reduced)
    const shadowState=`${size.width}/${size.height}/${flowState.beat}/${flowState.revision}`
    if(exhibit.shadowState!==shadowState){exhibit.key.shadow.needsUpdate=true;exhibit.shadowState=shadowState}
    const alpha=Math.min(1,p/.045)*(1-flowState.exit),ownsFrame=workshopOwnsFrame(s)
    const hostTriangles=ownsFrame?0:gl.info.render.triangles,hostCalls=ownsFrame?0:gl.info.render.calls
    if(alpha!==exhibit.alpha)setFade(exhibit,alpha)
    const shadowEnabled=gl.shadowMap.enabled
    gl.shadowMap.enabled=true
    try{
      if(alpha<.999){const autoClear=gl.autoClear;gl.autoClear=false;gl.clearDepth();try{gl.render(exhibit.scene,exhibit.camera)}finally{gl.autoClear=autoClear}}else gl.render(exhibit.scene,exhibit.camera)
    }finally{gl.shadowMap.enabled=shadowEnabled}
    flowState.triangles=gl.info.render.triangles+hostTriangles;flowState.calls=gl.info.render.calls+hostCalls
    const stage=stageRef.current
    if(stage){
      const opacity=String(alpha),triangles=String(flowState.triangles),calls=String(flowState.calls)
      if(stage.style.opacity!==opacity)stage.style.opacity=opacity
      if(stage.dataset.triangles!==triangles)stage.dataset.triangles=triangles
      if(stage.dataset.calls!==calls)stage.dataset.calls=calls
    }
    if(!s.paused&&!s.reduced)invalidate()
  },2)
  return null
}

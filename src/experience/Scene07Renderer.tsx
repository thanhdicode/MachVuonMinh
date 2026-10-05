import {useEffect,useRef} from 'react'
import {useFrame,useThree} from '@react-three/fiber'
import * as THREE from 'three'
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js'
import {easing} from 'maath'
import gsap from 'gsap'
import {createValueFlow} from './valueFlowGeometry'
import {flowState} from './scene07State'
import {useWorld} from './WorldState'

// The workshop uses the existing WebGL renderer and owns its scene lifecycle.
function createExhibit(gl:THREE.WebGLRenderer){
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
    const pmrem=new THREE.PMREMGenerator(gl),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04)
    scene.environment=env.texture;scene.environmentIntensity=.85;room.dispose();pmrem.dispose()
    const materials=new Map<THREE.Material,{opacity:number;transparent:boolean;depthWrite:boolean}>()
    value.root.traverse(o=>{if(o instanceof THREE.Mesh)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.set(m,{opacity:m.opacity,transparent:m.transparent,depthWrite:m.depthWrite}))})
    return {scene,camera,value,env,key,materials,background:scene.background,shadowState:''}
}
export function Scene07Renderer(){
  const {gl,size,invalidate}=useThree()
  const exhibitRef=useRef<ReturnType<typeof createExhibit>|null>(null)
  const preload=useWorld(s=>s.active===6||s.active===7)
  useEffect(()=>{
    if(!preload)return
    const exhibit=createExhibit(gl);exhibitRef.current=exhibit;invalidate()
    return()=>{exhibitRef.current=null;exhibit.value.dispose();exhibit.env.dispose();exhibit.key.shadow.dispose()}
  },[gl,invalidate,preload])
  useEffect(()=>{let prev='';const follow=()=>{const s=useWorld.getState();if(s.active!==7)return;const next=`${flowState.progress}/${flowState.revision}/${size.width}`;if(prev!==next){prev=next;invalidate()}};gsap.ticker.add(follow);return()=>gsap.ticker.remove(follow)},[invalidate,size.width])
  useFrame((_,delta)=>{
    const s=useWorld.getState();if(s.active!==7||flowState.static)return
    const exhibit=exhibitRef.current;if(!exhibit)return
    const aspect=size.width/size.height,compact=size.width<1100,p=flowState.progress
    exhibit.camera.aspect=aspect;exhibit.camera.updateProjectionMatrix()
    const z=15
    easing.damp3(exhibit.camera.position,[0,0,z],.35,Math.min(delta,.05))
    exhibit.camera.lookAt(0,0,0)
    const viewHeight=2*z*Math.tan(THREE.MathUtils.degToRad(21))
    exhibit.value.root.position.set(viewHeight*aspect*.225,-viewHeight*.015,0)
    exhibit.value.root.scale.setScalar(Math.min(viewHeight*aspect*.053,compact?.62:.92))
    exhibit.value.root.rotation.y=0
    exhibit.key.target.position.copy(exhibit.value.root.position)
    exhibit.value.update(p,delta,s.paused||s.reduced)
    const shadowState=`${size.width}/${size.height}/${flowState.beat}/${flowState.revision}`
    if(exhibit.shadowState!==shadowState){exhibit.key.shadow.needsUpdate=true;exhibit.shadowState=shadowState}
    const alpha=Math.min(1,p/.045)*(1-flowState.exit),hostTriangles=gl.info.render.triangles,hostCalls=gl.info.render.calls
    exhibit.materials.forEach((base,m)=>{m.opacity=base.opacity*alpha;m.transparent=base.transparent||alpha<.999;m.depthWrite=base.depthWrite&&alpha>.999})
    exhibit.scene.background=alpha>.999?exhibit.background:null
    const shadowEnabled=gl.shadowMap.enabled
    gl.shadowMap.enabled=true
    try{
      if(alpha<.999){const autoClear=gl.autoClear;gl.autoClear=false;gl.clearDepth();try{gl.render(exhibit.scene,exhibit.camera)}finally{gl.autoClear=autoClear}}else gl.render(exhibit.scene,exhibit.camera)
    }finally{gl.shadowMap.enabled=shadowEnabled}
    flowState.triangles=gl.info.render.triangles+hostTriangles;flowState.calls=gl.info.render.calls+hostCalls
    const stage=document.querySelector<HTMLElement>('.flow-stage')
    if(stage){
      stage.style.opacity=String(alpha)
      stage.dataset.triangles=String(flowState.triangles);stage.dataset.calls=String(flowState.calls)
    }
    if(!s.paused&&!s.reduced)invalidate()
  },2)
  return null
}

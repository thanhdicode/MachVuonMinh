import {useEffect,useRef} from 'react'
import {useFrame,useThree} from '@react-three/fiber'
import * as THREE from 'three'
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js'
import {easing} from 'maath'
import gsap from 'gsap'
import {createValueFlow} from './valueFlowGeometry'
import {flowState} from './scene07State'
import {useWorld} from './WorldState'

// React hosts only the lifecycle. Scene, camera and sculpture are raw Three.js.
function createExhibit(gl:THREE.WebGLRenderer){
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(42,1,.1,40)
    scene.background=new THREE.Color('#202321');camera.position.set(0,1,15)
    const value=createValueFlow();scene.add(value.root)
    const key=new THREE.DirectionalLight('#fff0d4',3);key.position.set(-4,7,8)
    const rim=new THREE.DirectionalLight('#d2aaa0',2);rim.position.set(5,1,-3)
    scene.add(key,rim,new THREE.HemisphereLight('#c4c8b6','#30211b',1))
    const pmrem=new THREE.PMREMGenerator(gl),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04)
    scene.environment=env.texture;scene.environmentIntensity=.6;room.dispose();pmrem.dispose()
    const materials=new Map<THREE.Material,{opacity:number;transparent:boolean;depthWrite:boolean}>()
    value.root.traverse(o=>{if(o instanceof THREE.Mesh)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.set(m,{opacity:m.opacity,transparent:m.transparent,depthWrite:m.depthWrite}))})
    return {scene,camera,value,env,materials,background:scene.background,point:new THREE.Vector3()}
}
export function Scene07Renderer(){
  const {gl,size,invalidate}=useThree()
  const exhibitRef=useRef<ReturnType<typeof createExhibit>|null>(null)
  const preload=useWorld(s=>s.active===6||s.active===7)
  useEffect(()=>{
    if(!preload)return
    const exhibit=createExhibit(gl);exhibitRef.current=exhibit;invalidate()
    return()=>{exhibitRef.current=null;exhibit.value.dispose();exhibit.env.dispose()}
  },[gl,invalidate,preload])
  useEffect(()=>{let prev='';const follow=()=>{const s=useWorld.getState();if(s.active!==7)return;const next=`${flowState.progress}/${flowState.revision}/${size.width}`;if(prev!==next){prev=next;invalidate()}};gsap.ticker.add(follow);return()=>gsap.ticker.remove(follow)},[invalidate,size.width])
  useFrame((_,delta)=>{
    const s=useWorld.getState();if(s.active!==7||flowState.static)return
    const exhibit=exhibitRef.current;if(!exhibit)return
    const aspect=size.width/size.height,compact=size.width<1100,p=flowState.progress
    exhibit.camera.aspect=aspect;exhibit.camera.updateProjectionMatrix()
    const z=aspect<1.4?17:15
    easing.damp3(exhibit.camera.position,[Math.sin(p*Math.PI)*.28,1,z],.35,Math.min(delta,.05))
    exhibit.camera.lookAt(0,0,0)
    exhibit.value.root.position.set(compact?.1:0,-2.15,0)
    exhibit.value.root.scale.setScalar(compact?.82:1)
    exhibit.value.root.rotation.y=Math.sin(p*Math.PI*2)*.08
    exhibit.value.update(p,delta,s.paused||s.reduced)
    const alpha=Math.min(1,p/.045)*(1-flowState.exit),hostTriangles=gl.info.render.triangles,hostCalls=gl.info.render.calls
    exhibit.materials.forEach((base,m)=>{m.opacity=base.opacity*alpha;m.transparent=base.transparent||alpha<.999;m.depthWrite=base.depthWrite&&alpha>.999})
    exhibit.scene.background=alpha>.999?exhibit.background:null
    if(alpha<.999){const autoClear=gl.autoClear;gl.autoClear=false;gl.clearDepth();gl.render(exhibit.scene,exhibit.camera);gl.autoClear=autoClear}else gl.render(exhibit.scene,exhibit.camera)
    flowState.triangles=gl.info.render.triangles+hostTriangles;flowState.calls=gl.info.render.calls+hostCalls
    const stage=document.querySelector<HTMLElement>('.flow-stage')
    if(stage){
      stage.style.opacity=String(alpha)
      for(const [name,object] of Object.entries(exhibit.value.anchors)){
        object.getWorldPosition(exhibit.point);exhibit.point.project(exhibit.camera)
        stage.style.setProperty(`--${name}-x`,`${(exhibit.point.x+1)*size.width/2}px`)
        stage.style.setProperty(`--${name}-y`,`${(1-exhibit.point.y)*size.height/2}px`)
      }
      stage.dataset.triangles=String(flowState.triangles);stage.dataset.calls=String(flowState.calls)
    }
  },2)
  return null
}

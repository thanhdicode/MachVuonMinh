import {useEffect,useMemo} from 'react'
import {useFrame,useThree} from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import {createLineShaftMechanism} from './lineShaftMechanism'
import {machineState} from './machineState'
import {timeline,useWorld} from './WorldState'

// The host renderer is borrowed; all exhibit objects belong to a raw scene.
export function MachineRenderer(){
  const {gl,size,invalidate}=useThree()
  useEffect(()=>{
    let previous=-1
    const followScrub=()=>{if(useWorld.getState().machine&&useWorld.getState().paused&&!machineState.static&&machineState.progress!==previous){previous=machineState.progress;invalidate()}}
    gsap.ticker.add(followScrub);return()=>gsap.ticker.remove(followScrub)
  },[invalidate])
  const exhibit=useMemo(()=>{
    const scene=new THREE.Scene(),world=new THREE.Group(),camera=new THREE.OrthographicCamera(-800,800,450,-450,.1,4000)
    camera.position.set(800,450,1800);camera.lookAt(800,450,0);scene.add(world)
    const loader=new THREE.TextureLoader(),hallTexture=loader.load('/images/machine-hall/hall.webp'),workerTexture=loader.load('/images/machine-hall/workers.webp')
    hallTexture.colorSpace=workerTexture.colorSpace=THREE.SRGBColorSpace
    const hallMaterial=new THREE.MeshBasicMaterial({map:hallTexture,color:'#9b9c93',transparent:true,depthWrite:false,toneMapped:false})
    const hall=new THREE.Mesh(new THREE.PlaneGeometry(1640,924),hallMaterial)
    hall.position.set(800,450,-110);world.add(hall)
    const mechanism=createLineShaftMechanism();world.add(mechanism.root)
    const mechanismMaterials=new Set<THREE.Material>()
    mechanism.root.traverse(object=>{if(object instanceof THREE.Mesh)(Array.isArray(object.material)?object.material:[object.material]).forEach(m=>{m.transparent=true;mechanismMaterials.add(m)})})
    const crops=[[0,.26],[.26,.53],[.53,.75],[.75,1]],positions=[[660,244],[1040,252],[1270,206],[450,175]]
    const workers=crops.map(([start,end],i)=>{
      const texture=workerTexture.clone();texture.offset.x=start;texture.repeat.x=end-start;texture.needsUpdate=true
      const material=new THREE.MeshBasicMaterial({map:texture,color:'#b2ada1',transparent:true,alphaTest:.035,depthWrite:false,toneMapped:false})
      const height=i===3?180:260,width=(end-start)*2*height
      const person=new THREE.Mesh(new THREE.PlaneGeometry(width,height),material)
      person.position.set(positions[i][0],positions[i][1],i===3?70:75);person.name=['lathe-operator','drill-operator','output-worker','maintenance-worker'][i]
      world.add(person);return {person,material,texture,y:positions[i][1]}
    })
    const materialPart=new THREE.Mesh(new THREE.CylinderGeometry(8,8,36,16),new THREE.MeshStandardMaterial({color:'#b7a985',metalness:.5,roughness:.65}))
    materialPart.rotation.z=Math.PI/2;materialPart.position.set(700,345,95);world.add(materialPart)
    const key=new THREE.DirectionalLight('#f3d2a0',2.1);key.position.set(50,1100,900)
    const fill=new THREE.HemisphereLight('#a7aaa0','#29241c',.75)
    const rim=new THREE.DirectionalLight('#bb8c55',.7);rim.position.set(1500,600,-150)
    scene.add(key,fill,rim)
    return {scene,world,camera,mechanism,mechanismMaterials,hall,hallMaterial,hallTexture,workerTexture,workers,materialPart,key,fill,background:new THREE.Color('#24251f'),coolKey:new THREE.Color('#c6d2d0'),coolFill:new THREE.Color('#abbec8')}
  },[])
  useEffect(()=>()=>{
    exhibit.mechanism.dispose();exhibit.hall.geometry.dispose();exhibit.hallMaterial.dispose();exhibit.hallTexture.dispose();exhibit.workerTexture.dispose()
    exhibit.workers.forEach(({person,material,texture})=>{person.geometry.dispose();material.dispose();texture.dispose()})
    exhibit.materialPart.geometry.dispose();exhibit.materialPart.material.dispose()
  },[exhibit])
  useFrame(({scene,camera},delta)=>{
    const state=useWorld.getState(),p=machineState.progress,compact=size.width<1100
    if(!state.machine||machineState.static){gl.render(scene,camera);return}
    exhibit.scene.background=machineState.exit>0?null:exhibit.background
    const width=900*size.width/size.height,center=compact?620:800
    exhibit.camera.left=-width/2;exhibit.camera.right=width/2;exhibit.camera.top=450;exhibit.camera.bottom=-450
    exhibit.camera.position.x=center;exhibit.camera.lookAt(center,450,0);exhibit.camera.updateProjectionMatrix()
    const pull=THREE.MathUtils.smoothstep(p,.18,.56),zoom=1.85-.85*pull,focusX=330+(center-330)*pull,focusY=340+110*pull
    exhibit.world.scale.setScalar(zoom);exhibit.world.position.set(center-focusX*zoom,450-focusY*zoom,0)
    const entrance=THREE.MathUtils.smoothstep(p,.015,.16),dim=1-.16*THREE.MathUtils.smoothstep(p,.78,.9),handoff=1-machineState.exit
    exhibit.hallMaterial.opacity=entrance*dim*handoff
    exhibit.hall.position.x=800+(1-pull)*8;exhibit.hall.position.y=450+(1-pull)*4
    const cool=THREE.MathUtils.smoothstep(p,.9,1)
    exhibit.key.color.set('#f3d2a0').lerp(exhibit.coolKey,cool);exhibit.fill.color.set('#a7aaa0').lerp(exhibit.coolFill,cool)
    exhibit.mechanism.update(p,state.paused?0:timeline.velocity,state.paused?0:Math.min(delta,.05),compact)
    exhibit.mechanismMaterials.forEach(m=>{m.opacity=entrance*handoff;m.depthWrite=m.opacity>.99})
    exhibit.mechanism.root.visible=entrance>0
    exhibit.workers.forEach(({person,material,y},i)=>{
      person.visible=!(compact&&i===2);material.opacity=THREE.MathUtils.smoothstep(p,.52+i*.008,.6+i*.008)*dim*handoff
      person.position.y=y+(state.paused?0:Math.sin(p*9+i)*1.5)
    })
    exhibit.materialPart.visible=p>.56&&p<.94
    exhibit.materialPart.position.set(machineState.materialX,machineState.materialY,95)
    if(machineState.exit>0){
      gl.render(scene,camera);const autoClear=gl.autoClear;gl.autoClear=false;gl.clearDepth()
      gl.render(exhibit.scene,exhibit.camera);gl.autoClear=autoClear
    }else{gl.setClearColor('#1e211e',0);gl.render(exhibit.scene,exhibit.camera)}
  },1)
  return null
}

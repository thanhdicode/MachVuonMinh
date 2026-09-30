import { useEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

export function ProductionCar() {
  const {scene}=useGLTF('/models/production-car.glb','/draco/')
  const model=useMemo(()=>{
    const object=scene.clone(true)
    object.traverse(node=>{
      if(!(node instanceof THREE.Mesh))return
      const old=node.material as THREE.MeshStandardMaterial
      const material=new THREE.MeshPhysicalMaterial({color:'#414547',metalness:.45,roughness:.4,envMapIntensity:.5})
      if(old.name==='Body_Color') {material.color.set('#851d28');material.metalness=.45;material.roughness=.36;material.clearcoat=.8;material.clearcoatRoughness=.2}
      else if(old.name==='Glass_Gray'){material.color.set('#10272e');material.metalness=.25;material.roughness=.22}
      else if(/tire|carpet|leather|interior|carbon/i.test(old.name)){material.color.set('#161c1d');material.metalness=0;material.roughness=.86}
      else if(/taillight|signal/i.test(old.name))material.color.set('#850d14')
      else if(/chrome|metal/i.test(old.name)){material.color.set('#727b80');material.metalness=.75;material.roughness=.32}
      else if(old.name==='Projector_Glass')material.color.set('#b8c8c9')
      node.material=material
    })
    const box=new THREE.Box3().setFromObject(object),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3())
    const scale=2.6/Math.max(size.x,size.z)
    object.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale)
    object.scale.setScalar(scale)
    return object
  },[scene])
  useEffect(()=>()=>model.traverse(node=>{if(node instanceof THREE.Mesh)(node.material as THREE.Material).dispose()}),[model])
  return <primitive object={model} dispose={null}/>
}

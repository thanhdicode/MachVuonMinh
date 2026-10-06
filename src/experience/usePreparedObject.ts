import {useLayoutEffect,type RefObject} from 'react'
import {useThree} from '@react-three/fiber'
import type * as THREE from 'three'
import {prepareScene} from './prepareScene'

// Late GLTF assets must prepare their shaders before becoming visible, too.
export function usePreparedObject(input:THREE.Object3D|RefObject<THREE.Object3D|null>){
  const {gl,scene,camera,invalidate}=useThree()
  useLayoutEffect(()=>{
    const object='current' in input?input.current:input
    if(!object)return
    let cancelled=false
    object.visible=false
    void prepareScene(gl,object,camera,scene).then(()=>{
      if(!cancelled){object.visible=true;invalidate()}
    }).catch(error=>{if(!cancelled)console.error('Model shader preparation failed',error)})
    return()=>{cancelled=true}
  },[input,gl,scene,camera,invalidate])
}

import {useLayoutEffect} from 'react'
import {useLoader,useThree} from '@react-three/fiber'
import {CubeUVReflectionMapping} from 'three'
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js'

// Original Lightformer studio, already convolved into the 128px PMREM atlas.
// CubeUV mapping bypasses the first-load cubemap capture and GGX filter passes.
export function StudioEnvironment(){
  const texture=useLoader(HDRLoader,'/textures/studio-cubeuv.hdr')
  const {scene,gl,invalidate}=useThree()
  useLayoutEffect(()=>{
    const previous=scene.environment
    texture.mapping=CubeUVReflectionMapping;texture.flipY=false;texture.needsUpdate=true
    gl.initTexture(texture);scene.environment=texture;invalidate()
    return()=>{scene.environment=previous}
  },[texture,scene,gl,invalidate])
  return null
}

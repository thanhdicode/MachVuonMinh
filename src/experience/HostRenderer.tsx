import {useEffect,useRef} from 'react'
import {useFrame,useThree} from '@react-three/fiber'
import {workshopOwnsFrame} from './scene07State'
import {scene02State} from './scene02State'
import {useWorld} from './WorldState'
import {prepareScene} from './prepareScene'

export function HostRenderer(){
  const {gl,scene,camera,invalidate}=useThree(),ready=useRef(false)
  useEffect(()=>{
    let cancelled=false
    void prepareScene(gl,scene,camera).then(()=>{if(!cancelled){ready.current=true;invalidate()}}).catch(error=>console.error('World shader preparation failed',error))
    return()=>{cancelled=true;ready.current=false}
  },[gl,scene,camera,invalidate])
  useFrame(()=>{
    const state=useWorld.getState()
    if(!ready.current||workshopOwnsFrame(state))return
    // Full-screen opaque media owns Scene 02; the existing canvas serves its exit.
    if(state.machine&&scene02State.exit===0)return
    gl.render(scene,camera)
  },1)
  return null
}

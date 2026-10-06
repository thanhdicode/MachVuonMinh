import {useEffect,useRef} from 'react'
import {useFrame,useThree} from '@react-three/fiber'
import {workshopOwnsFrame} from './scene07State'
import {scene02State} from './scene02State'
import {useWorld} from './WorldState'
import {prepareScene} from './prepareScene'
import {prepareInStages,yieldForPaint} from './startupWarmup'

export function HostRenderer(){
  const {gl,scene,camera,invalidate}=useThree(),ready=useRef(false)
  useEffect(()=>{
    let cancelled=false
    const first=scene.getObjectByName('chapter-0'),cord=scene.getObjectByName('intro-cord')
    const initial=first?[first,...(cord?[cord]:[])]:[scene]
    const background=scene.children.filter(child=>!initial.includes(child)&&!(child as {isLight?:boolean}).isLight)
    void prepareInStages({initial,background,
      prepare:object=>prepareScene(gl,object,camera,scene),yieldTask:yieldForPaint,
      isCancelled:()=>cancelled,
      onReady:()=>{ready.current=true;invalidate()},
    }).catch(error=>{
      console.error('World shader preparation failed',error)
      // A failed warmup must not permanently suppress the renderer.
      if(!cancelled){ready.current=true;invalidate()}
    })
    return()=>{cancelled=true;ready.current=false}
  },[gl,scene,camera,invalidate])
  useFrame(()=>{
    const state=useWorld.getState()
    if(!ready.current||(state.worldReady&&workshopOwnsFrame(state)))return
    // Full-screen opaque media owns Scene 02; the existing canvas serves its exit.
    if(state.worldReady&&state.machine&&scene02State.exit===0)return
    gl.render(scene,camera)
    if(!state.worldReady){performance.mark('world-first-frame');state.set({worldReady:true})}
  },1)
  return null
}

import type {Scene07AudioInput,Scene07Gesture,Scene07AudioDiagnostics} from './scene07AudioState'
export {isScene07Audible,scene07PulseBpm,shouldPlayScene07Finale} from './scene07AudioState.ts'
export type {Scene07AudioInput,Scene07Gesture,Scene07AudioDiagnostics} from './scene07AudioState'

// Resume in the click handler before awaiting Tone, preserving mobile activation.
let engine:typeof import('./Scene07AudioSynth')['scene07Audio']|undefined
let context:AudioContext|undefined,activation=0
let input:Scene07AudioInput={active:false,paused:false,hidden:false,beat:0,progress:0,velocity:0}
export const scene07Audio={
  async preload(){try{await import('./Scene07AudioSynth')}catch{/* Start can retry and report failure. */}},
  async start():Promise<boolean>{
    const token=++activation
    try{
      context??=new AudioContext();const resumed=context.resume()
      const module=await import('./Scene07AudioSynth');await resumed
      if(token!==activation)return false
      engine=module.scene07Audio;engine.bindContext(context);engine.sync(input)
      return await engine.start()
    }catch(error){console.warn('Scene07 audio loading failed',error);return false}
  },
  stop(){activation++;engine?.stop()},
  sync(next:Scene07AudioInput){input=next;engine?.sync(next)},
  gesture(kind:Scene07Gesture){engine?.gesture(kind)},
  diagnostics():Scene07AudioDiagnostics{return engine?.diagnostics()??{state:context?.state??'uninitialized',rms:0,enabled:false}},
  dispose(){activation++;engine?.dispose();void context?.close();context=undefined},
}

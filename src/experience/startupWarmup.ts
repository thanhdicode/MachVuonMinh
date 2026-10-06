type StagedPreparation<T> = {
  initial: T[]
  background: T[]
  prepare: (value: T) => Promise<void>
  yieldTask: () => Promise<void>
  isCancelled: () => boolean
  onReady: () => void
}

export async function prepareInStages<T>({initial,background,prepare,yieldTask,isCancelled,onReady}:StagedPreparation<T>) {
  for(const value of initial){
    if(isCancelled())return
    await prepare(value)
  }
  if(isCancelled())return
  onReady()
  for(const value of background){
    await yieldTask()
    if(isCancelled())return
    await prepare(value)
  }
}

// Let the ready frame paint, then use idle slots for subsequent chapter shaders.
// The timeout keeps preparation progressing on a busy laptop.
export const yieldForPaint=()=>new Promise<void>(resolve=>{
  requestAnimationFrame(()=>{
    if('requestIdleCallback' in window)window.requestIdleCallback(()=>resolve(),{timeout:200})
    else setTimeout(resolve,16)
  })
})

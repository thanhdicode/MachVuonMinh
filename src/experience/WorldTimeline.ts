import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { stops, timeline, useWorld } from './WorldState'
gsap.registerPlugin(ScrollTrigger)
gsap.ticker.lagSmoothing(0)
let lenis: Lenis | undefined
export function goToScene(index: number) {
  if (!Number.isInteger(index) || index < 0 || index >= stops.length - 1) return
  if(index>0&&!useWorld.getState().unlocked)useWorld.getState().set({unlocked:true})
  const progress = stops[index] + (stops[index + 1] - stops[index]) * .32
  lenis?.resize()
  lenis?.scrollTo(progress * (document.documentElement.scrollHeight - innerHeight), { immediate: useWorld.getState().reduced, force: true })
}
export function startTimeline() {
  if (!useWorld.getState().unlocked) { window.scrollTo(0,0);timeline.scene=0;timeline.local=0;timeline.progress=0;useWorld.getState().set({active:0}) }
  lenis = new Lenis({ duration: .85, smoothWheel: !useWorld.getState().reduced })
  lenis.on('scroll', (event: { velocity: number }) => { timeline.velocity = event.velocity; ScrollTrigger.update() })
  const update = (time: number) => lenis?.raf(time * 1000)
  gsap.ticker.add(update)
  const trigger = ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (self) => {
    const unlocked=useWorld.getState().unlocked
    const p = unlocked ? Math.min(.999999, self.progress) : 0
    const scene = stops.findIndex((stop, i) => p >= stop && p < stops[i + 1])
    timeline.progress = p; timeline.scene = Math.max(0, scene); timeline.local = (p - stops[timeline.scene]) / (stops[timeline.scene + 1] - stops[timeline.scene])
    const beat = timeline.local < .45 ? 0 : 1
    if (useWorld.getState().active !== timeline.scene || useWorld.getState().beat !== beat) useWorld.getState().set({ active: timeline.scene, beat })
    document.documentElement.style.setProperty('--progress', String(p))
    document.documentElement.style.setProperty('--beat', String(timeline.local))
    document.documentElement.style.setProperty('--scene-opacity', String(useWorld.getState().reduced || timeline.scene === 8 ? 1 : Math.max(0, 1 - Math.max(0,(timeline.local-.78)/.18))))
    if(!unlocked&&self.progress>0)lenis?.scrollTo(0,{immediate:true,force:true})
  } })
  const unsubscribe = useWorld.subscribe((state, previous) => {
    if (state.unlocked !== previous.unlocked) {
      if (!state.unlocked) lenis?.stop()
      else requestAnimationFrame(() => { lenis?.resize(); lenis?.start(); ScrollTrigger.refresh() })
    }
    if (state.reduced !== previous.reduced && lenis) lenis.options.smoothWheel = !state.reduced
  })
  if (!useWorld.getState().unlocked) lenis.stop()
  const keepEntryAtTop=()=>{
    if(!useWorld.getState().unlocked&&window.scrollY!==0){
      window.scrollTo({top:0,behavior:'instant'})
      lenis?.scrollTo(0,{immediate:true,force:true})
    }
  }
  const resize = () => {
    const progress = timeline.progress
    lenis?.resize()
    ScrollTrigger.refresh()
    lenis?.scrollTo(progress * (document.documentElement.scrollHeight - innerHeight), { immediate: true, force: true })
    ScrollTrigger.update()
  }
  window.addEventListener('resize', resize)
  window.addEventListener('scroll',keepEntryAtTop,{passive:true})
  window.addEventListener('pageshow',keepEntryAtTop)
  keepEntryAtTop()
  ScrollTrigger.refresh()
  return () => { window.removeEventListener('resize',resize); window.removeEventListener('scroll',keepEntryAtTop); window.removeEventListener('pageshow',keepEntryAtTop); unsubscribe(); trigger.kill(); gsap.ticker.remove(update); lenis?.destroy(); lenis = undefined }
}


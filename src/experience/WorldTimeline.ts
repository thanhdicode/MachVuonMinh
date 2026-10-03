import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { stops, timeline, useWorld } from './WorldState'
import { historyStep, historyProgressForTravel } from './historyGeometry'
import { machineState, journeyProgress, journeyPosition, type JourneyRange } from './machineState'
import { canResumeScroll, createScrollLeases } from '../onboarding/guideSession'
import type { ScrollOwner } from '../onboarding/guideSession'
gsap.registerPlugin(ScrollTrigger)
gsap.ticker.lagSmoothing(0)
let lenis: Lenis | undefined
// Scroll is locked while any owner (tour, game, dialog) holds a lease; it resumes only when none does and the intro is unlocked.
const scrollLeases = createScrollLeases(locked => {
  document.body.classList.toggle('guide-scroll-locked', locked)
  if(locked){lenis?.stop();timeline.velocity=0}
  else if(canResumeScroll({unlocked:useWorld.getState().unlocked,leasesLocked:false}))lenis?.start()
})
export const acquireScrollLease=(owner:ScrollOwner)=>scrollLeases.acquire(owner)
export const scrollLeaseCounts=()=>scrollLeases.counts()
let legacyGameLease:(()=>void)|undefined
// Kept for callers that still use the boolean API; it maps onto the game owner.
export function setTimelineSuspended(suspended:boolean) {
  if(suspended){legacyGameLease??=scrollLeases.acquire('game')}
  else {legacyGameLease?.();legacyGameLease=undefined}
}
function journeyRange(): JourneyRange {
  const atlas = document.querySelector<HTMLElement>('.history-insertion')
  const machine = document.querySelector<HTMLElement>('.machine-insertion')
  const atlasLength = atlas?.offsetHeight ?? 0, machineLength = machine?.offsetHeight ?? 0
  const atlasStart = atlas?.offsetTop ?? 13 * innerHeight * stops[2]
  return { base:Math.max(1,(document.documentElement.scrollHeight-innerHeight-atlasLength-machineLength)/.88), atlasStart, atlasLength, machineStart:machine?.offsetTop ?? atlasStart+atlasLength, machineLength }
}
export function scrollToPosition(y: number, immediate = useWorld.getState().reduced) {
  lenis?.resize()
  lenis?.scrollTo(y, {immediate, force:true})
}
export function goToHistory() {
  if (!useWorld.getState().unlocked) useWorld.getState().set({unlocked:true})
  requestAnimationFrame(() => scrollToPosition(journeyRange().atlasStart))
}
export function goToHistoryEnd() {
  if (!useWorld.getState().unlocked) useWorld.getState().set({unlocked:true})
  requestAnimationFrame(() => { const range = journeyRange(); scrollToPosition(range.atlasStart + Math.max(0, range.atlasLength - innerHeight)) })
}
export function goToScene(index: number) {
  if (!Number.isInteger(index) || index < 0 || index >= stops.length - 1) return
  if(index>0&&!useWorld.getState().unlocked)useWorld.getState().set({unlocked:true})
  const progress = stops[index] + (stops[index + 1] - stops[index]) * .32
  const range = journeyRange()
  scrollToPosition(index===2 ? range.machineStart + (range.machineLength-innerHeight)*.16 : journeyPosition(progress,range))
}
export function startTimeline() {
  if (!useWorld.getState().unlocked) { window.scrollTo(0,0);timeline.scene=0;timeline.local=0;timeline.progress=0;useWorld.getState().set({active:0}) }
  lenis = new Lenis({ duration: .85, smoothWheel: !useWorld.getState().reduced })
  lenis.on('scroll', (event: { velocity: number }) => { timeline.velocity = event.velocity; ScrollTrigger.update() })
  const update = (time: number) => lenis?.raf(time * 1000)
  gsap.ticker.add(update)
  let refreshing=false, refreshFrame=0
  const sync = (self:ScrollTrigger) => {
    if (refreshing) return
    const unlocked=useWorld.getState().unlocked
    const range = journeyRange(), y = self.scroll()
    const inHistory = unlocked && y >= range.atlasStart && y < range.machineStart
    const inMachine = unlocked && y >= range.machineStart && y < range.machineStart+range.machineLength
    machineState.active=inMachine
    machineState.exit=inMachine?Math.max(0,Math.min(1,(y-(range.machineStart+range.machineLength-innerHeight))/innerHeight)):0
    const p = unlocked ? Math.min(.999999, journeyProgress(y,range)) : 0
    const scene = stops.findIndex((stop, i) => p >= stop && p < stops[i + 1])
    timeline.progress = p; timeline.scene = Math.max(0, scene); timeline.local = (p - stops[timeline.scene]) / (stops[timeline.scene + 1] - stops[timeline.scene])
    const beat = timeline.local < .45 ? 0 : 1
    if (useWorld.getState().active !== timeline.scene || useWorld.getState().beat !== beat || useWorld.getState().history !== inHistory || useWorld.getState().machine !== inMachine) useWorld.getState().set({ active: timeline.scene, beat, history:inHistory, machine:inMachine })
    document.documentElement.style.setProperty('--progress', String(p))
    document.documentElement.style.setProperty('--beat', String(timeline.local))
    document.documentElement.style.setProperty('--scene-opacity', String(useWorld.getState().reduced || timeline.scene === 8 ? 1 : Math.max(0, 1 - Math.max(0,(timeline.local-.78)/.18))))
    if(!unlocked&&self.progress>0)lenis?.scrollTo(0,{immediate:true,force:true})
  }
  const trigger = ScrollTrigger.create({ start: 0, end: 'max', onUpdate:sync,
    onRefreshInit:()=>{refreshing=true},
    onRefresh:self=>{refreshing=false;cancelAnimationFrame(refreshFrame);refreshFrame=requestAnimationFrame(()=>sync(self))},
  })
  const unsubscribe = useWorld.subscribe((state, previous) => {
    if (state.unlocked !== previous.unlocked) {
      if (!state.unlocked) lenis?.stop()
      else requestAnimationFrame(() => { lenis?.resize(); if(!scrollLeases.isLocked())lenis?.start(); ScrollTrigger.refresh() })
    }
    if (state.reduced !== previous.reduced && lenis) {
      lenis.options.smoothWheel = !state.reduced
      requestAnimationFrame(() => {
        lenis?.resize()
        ScrollTrigger.refresh()
        ScrollTrigger.update()
      })
    }
  })
    if (!useWorld.getState().unlocked || scrollLeases.isLocked()) lenis.stop()
  const keepEntryAtTop=()=>{
    if(!useWorld.getState().unlocked&&window.scrollY!==0){
      window.scrollTo({top:0,behavior:'instant'})
      lenis?.scrollTo(0,{immediate:true,force:true})
    }
  }
  const resize = () => {
    const progress = timeline.progress, inHistory = useWorld.getState().history, inMachine=useWorld.getState().machine, machineProgress=machineState.progress
    const era = Number(document.querySelector<HTMLElement>('.history-bridge')?.dataset.activeEra ?? 0)
    requestAnimationFrame(() => {
      lenis?.resize()
      ScrollTrigger.refresh()
      const range = journeyRange()
      let position = journeyPosition(progress,range)
      if(inMachine) {
        if(!useWorld.getState().reduced && innerWidth>=768) position=range.machineStart+machineProgress*(range.machineLength-innerHeight)
        else {const target=document.querySelector<HTMLElement>(`[data-static-beat="${machineState.staticBeat}"]`);if(target)position=target.getBoundingClientRect().top+window.scrollY-125}
      }
      if (inHistory) {
        if (!useWorld.getState().reduced && innerWidth >= 900) position = range.atlasStart + historyProgressForTravel((era*historyStep/100+.01)*innerWidth,range.atlasLength-innerHeight)*(range.atlasLength-innerHeight)
        else {
          const target=document.querySelector<HTMLElement>(`[data-label-era="${era}"] .history-mobile-copy`)
          if (target) position=target.getBoundingClientRect().top+window.scrollY-140
        }
      }
      scrollToPosition(position, true)
      ScrollTrigger.update()
    })
  }
  window.addEventListener('resize', resize)
  window.addEventListener('scroll',keepEntryAtTop,{passive:true})
  window.addEventListener('pageshow',keepEntryAtTop)
  keepEntryAtTop()
  ScrollTrigger.refresh()
  return () => { cancelAnimationFrame(refreshFrame); window.removeEventListener('resize',resize); window.removeEventListener('scroll',keepEntryAtTop); window.removeEventListener('pageshow',keepEntryAtTop); unsubscribe(); trigger.kill(); gsap.ticker.remove(update); lenis?.destroy(); lenis = undefined }
}


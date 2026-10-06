import { create } from 'zustand'
export const timeline = { progress: 0, scene: 0, local: 0, velocity: 0, pointer: [0, 0] as [number, number], dragging: false, endpoint: [0, 0] as [number, number] }
export const stops = [0, .08, .18, .30, .41, .53, .70, .82, .92, 1]
type State = { worldReady: boolean; active: number; history: boolean; machine: boolean; beat: number; evidenceCase: number; evidenceLens: number; farmStage: number; unlocked: boolean; reduced: boolean; paused: boolean; sound: boolean; automation: number; forces: number[]; relations: number[]; reconfigure: number; slots: (number|null)[]; set: (value: Partial<Omit<State, 'set'>>) => void }
export const useWorld = create<State>((set) => ({ worldReady:false, active: 0, history:false, machine:false, beat: 0, evidenceCase:0, evidenceLens:0, farmStage:1, unlocked: false, reduced: typeof window!=='undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches, paused: false, sound: false, automation: 60, forces: [50,50,50,50,50], relations: [50,50,50], reconfigure: 0, slots: [null,null,null], set }))
let audio: AudioContext | undefined
export function tick(frequency = 220) {
  if (!useWorld.getState().sound) return
  try {
    audio ??= new AudioContext(); void audio.resume()
    const oscillator = audio.createOscillator(), gain = audio.createGain()
    oscillator.frequency.setValueAtTime(frequency, audio.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(frequency / 2, audio.currentTime + .12)
    gain.gain.setValueAtTime(.04, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .18)
    oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + .2)
  } catch {}
}


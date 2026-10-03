export const machineState = { progress: 0, exit: 0, active: false, static: false, staticBeat: 0, zoom: 1, pan: 0, materialX: 700, materialY: 345 }
export const machineProgress = (value: number) => Math.max(0, Math.min(1, value))
export function machineBeat(p: number) { return p < .045 ? 0 : p < .13 ? 1 : p < .24 ? 2 : p < .52 ? 3 : p < .65 ? 4 : p < .78 ? 5 : p < .865 ? 6 : p < .95 ? 7 : 8 }
export function machineRhythmGain(velocity: number, p: number, active: boolean) { return !active || p<.12 ? 0 : .008+Math.min(1,Math.abs(velocity)/12)*.012 }
export type JourneyRange = { base: number; atlasStart: number; atlasLength: number; machineStart: number; machineLength: number }
export function journeyProgress(y: number, r: JourneyRange) {
  if (y < r.atlasStart) return machineProgress(y / r.base)
  if (y < r.machineStart) return .18 - .000001
  if (y < r.machineStart + r.machineLength) return .18 + .12 * machineProgress((y-r.machineStart)/r.machineLength)
  return machineProgress((y-r.atlasLength-r.machineLength)/r.base + .12)
}
export function journeyPosition(p: number, r: JourneyRange) {
  if (p < .18) return p*r.base
  if (p < .30) return r.machineStart+(p-.18)/.12*r.machineLength
  return (p-.12)*r.base+r.atlasLength+r.machineLength
}

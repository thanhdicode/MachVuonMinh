const clamp=(v:number)=>Math.max(0,Math.min(1,v))
// Insertion coordinates stay stable for navigation into the unchanged later chapters.
export type JourneyRange={base:number;atlasStart:number;atlasLength:number;machineStart:number;machineLength:number}
export function journeyProgress(y:number,r:JourneyRange){
  if(y<r.atlasStart)return .18*clamp(y/Math.max(1,r.atlasStart))
  if(y<r.machineStart)return .18-.000001
  if(y<r.machineStart+r.machineLength)return .18+.12*clamp((y-r.machineStart)/r.machineLength)
  return clamp(.30+(y-r.machineStart-r.machineLength)/r.base)
}
export function journeyPosition(p:number,r:JourneyRange){
  if(p<.18)return p/.18*r.atlasStart
  if(p<.30)return r.machineStart+(p-.18)/.12*r.machineLength
  return r.machineStart+r.machineLength+(p-.30)*r.base
}

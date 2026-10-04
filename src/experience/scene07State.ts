import { journeyProgress, journeyPosition, type JourneyRange } from './machineState.ts'

export const flowState = { progress:0, exit:0, active:false, static:false, beat:0, work:.25, access:1, split:.5, revision:0, triangles:0, calls:0 }
export const flowProgress=(value:number)=>Math.max(0,Math.min(1,Number.isFinite(value)?value:0))
export const flowBeat=(p:number)=>p<.12?0:p<.38?1:p<.65?2:p<.88?3:4
export const flowReveal=(p:number)=>p>=.28&&p<.38||p>=.54&&p<.65||p>=.79&&p<.88||p>=.93
export function updateFlow(input:Partial<Pick<typeof flowState,'work'|'access'|'split'>>) {
  if(input.work!==undefined)flowState.work=flowProgress(input.work)
  if(input.access!==undefined)flowState.access=Math.round(flowProgress(input.access/2)*2)
  if(input.split!==undefined)flowState.split=flowProgress(input.split)
  flowState.revision++
  if(typeof document!=='undefined')document.dispatchEvent(new Event('scene07-input'))
}
export const captureFlowInputs=()=>({work:flowState.work,access:flowState.access,split:flowState.split})
export const restoreFlowInputs=(input:ReturnType<typeof captureFlowInputs>)=>updateFlow(input)
export const accessResponse=(access:number)=>[
  'Dữ liệu ở trong xưởng. Các nguồn bên ngoài chưa kết nối.',
  'Các nguồn cùng trao đổi. Quyền sử dụng cần được thỏa thuận.',
  'Dữ liệu đi qua cổng cấp quyền. Mỗi bên chỉ dùng phần được cho phép.',
][Math.max(0,Math.min(2,Math.round(access)))]
export const splitterResponse=(value:number)=>flowProgress(value)<.34?'Dòng mới nghiêng về thu nhập lao động.':flowProgress(value)>.66?'Dòng mới nghiêng về đổi mới và năng lực mới.':'Dòng mới nghiêng về tái đầu tư.'
export type FlowJourneyRange=JourneyRange&{flowStart:number;flowLength:number}
export function flowJourneyProgress(y:number,r:FlowJourneyRange){
  if(y<r.flowStart)return journeyProgress(y,r)
  if(y<r.flowStart+r.flowLength)return .82+.1*flowProgress((y-r.flowStart)/r.flowLength)
  return journeyProgress(y-r.flowLength+.1*r.base,r)
}
export function flowJourneyPosition(p:number,r:FlowJourneyRange){
  if(p<.82)return journeyPosition(p,r)
  if(p<.92)return r.flowStart+(p-.82)/.1*r.flowLength
  return journeyPosition(p,r)+r.flowLength-.1*r.base
}

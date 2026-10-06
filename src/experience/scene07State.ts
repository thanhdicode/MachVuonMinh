import { journeyProgress, journeyPosition, type JourneyRange } from './journey.ts'

export const flowState = { progress:0, exit:0, active:false, static:false, renderReady:false, beat:0, work:.25, access:1, split:.5, revision:0, triangles:0, calls:0 }
// The host must still draw during loading, static mode and transparent handoffs.
export function workshopOwnsFrame(world:{active:number},flow:Pick<typeof flowState,'static'|'renderReady'|'progress'|'exit'>=flowState){
  return world.active===7&&!flow.static&&flow.renderReady&&flow.progress>=.045&&flow.exit===0
}
export const flowProgress=(value:number)=>Math.max(0,Math.min(1,Number.isFinite(value)?value:0))
export const flowOption=(value:number)=>flowProgress(value)<.34?0:flowProgress(value)>.66?2:1
export const flowBeat=(p:number)=>p<.12?0:p<.38?1:p<.65?2:p<.88?3:4
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
  'Xưởng bỏ tiền mua máy, sở hữu máy và quyết định cách dùng. Xưởng cũng chịu chi phí bảo trì; quyền dùng dữ liệu cần được làm rõ.',
  'Xưởng trả tiền thuê để dùng máy. Máy vẫn thuộc bên cho thuê; hợp đồng cần rõ ai bảo trì và ai được dùng dữ liệu máy tạo ra.',
  'Các bên cùng góp tiền mua máy, rồi thỏa thuận ai được dùng, ai quyết định và ai chịu trách nhiệm.',
][Math.max(0,Math.min(2,Math.round(access)))]
export const splitterResponse=(value:number)=>[
  'Người lao động nhận tiền công, có thể được thưởng theo đóng góp. Máy làm nhanh hơn không tự bảo đảm thu nhập tăng; cách trả công cần rõ ràng.',
  'Sau chi phí và các nghĩa vụ, lợi nhuận có thể chia cho người góp vốn theo thỏa thuận. Các bên cần biết cách tính phần mình được nhận.',
  'Một phần lợi nhuận có thể được giữ lại để sửa máy, đào tạo người và đổi mới công nghệ. Các bên thống nhất khoản giữ lại dùng vào việc gì.',
][flowOption(value)]
export type FlowJourneyRange=JourneyRange&{flowStart:number;flowLength:number}
export function flowJourneyProgress(y:number,r:FlowJourneyRange){
  const presentEnd=r.machineStart+r.machineLength
  if(y<presentEnd)return journeyProgress(y,r)
  if(y<r.flowStart)return .30+.52*flowProgress((y-presentEnd)/Math.max(1,r.flowStart-presentEnd))
  if(y<r.flowStart+r.flowLength)return .82+.1*flowProgress((y-r.flowStart)/r.flowLength)
  return flowProgress(.92+(y-r.flowStart-r.flowLength)/r.base)
}
export function flowJourneyPosition(p:number,r:FlowJourneyRange){
  if(p<.30)return journeyPosition(p,r)
  if(p<.82)return r.machineStart+r.machineLength+(p-.30)/.52*(r.flowStart-r.machineStart-r.machineLength)
  if(p<.92)return r.flowStart+(p-.82)/.1*r.flowLength
  return r.flowStart+r.flowLength+(p-.92)*r.base
}

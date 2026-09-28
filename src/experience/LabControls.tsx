import { useEffect, useState } from 'react'
import { labState } from './model'
import { tick, useWorld } from './WorldState'
export function LabControls() {
  const state=useWorld(), model=labState(state.forces,state.relations), [reassembling,setReassembling]=useState(false)
  useEffect(()=>{if(!state.reconfigure)return;setReassembling(true);const timer=setTimeout(()=>setReassembling(false),1800);return()=>clearTimeout(timer)},[state.reconfigure])
  const preset=(name:string)=>{tick(160);if(name==='fit')state.set({forces:[50,50,50,50,50],relations:[50,50,50]});if(name==='ahead')state.set({forces:[90,85,80,90,85],relations:[35,35,35]});if(name==='rigid')state.set({forces:[60,65,55,60,60],relations:[10,15,15]});if(name==='adapt')state.set({relations:[model.force*100,model.force*100,model.force*100],reconfigure:Date.now()})}
  const controls=(names:string[],values:number[],side:'forces'|'relations')=><div className={`lab-controls ${side}`}><div className="control-heading"><span>{side==='forces'?'LLSX':'QHSX'}</span><small>{side==='forces'?'Lực lượng sản xuất':'Quan hệ sản xuất'}</small></div>{names.map((name,i)=><label key={name}><span>{name}<output>{Math.round(values[i])}</output></span><input type="range" min="0" max="100" step="1" aria-label={name} value={values[i]} onChange={e=>state.set({[side]:values.map((v,j)=>j===i?Number(e.target.value):v)})}/></label>)}<p>{side==='forces'?'Năng lực của người lao động và tư liệu sản xuất.':'Ai sở hữu tư liệu? Ai tổ chức? Thành quả được chia thế nào?'}</p></div>
  return <section className={`lab-overlay ${model.state}`} aria-label="Phòng biện chứng">
    <div className="lab-heading"><span className="eyebrow">05 / PHÒNG BIỆN CHỨNG</span><h2>Quan hệ mở đường — hay kìm hãm?</h2></div>
    {controls(['Công nghệ','Dữ liệu','Kỹ năng','Hạ tầng','Tự động hóa'],state.forces,'forces')}
    {controls(['Sở hữu','Tổ chức–quản lý','Phân phối'],state.relations,'relations')}
    <div className="core-label core-label-inner">01 / NĂNG LỰC SẢN XUẤT</div><div className="core-label core-label-outer">02 / CẤU TRÚC QUAN HỆ</div>
    <div className="lab-bottom"><div className="lab-status" aria-live="polite"><strong>{reassembling?'TÁI CẤU TRÚC':model.state==='fit'?'PHÙ HỢP':model.state==='strain'?'CĂNG THẲNG':'MÂU THUẪN'}</strong><p>{reassembling?'Cấu trúc điều chỉnh. Dòng vận động được khơi thông.':model.state==='fit'?'Năng lực và quan hệ cùng nhịp. Dòng vận động thông suốt.':model.gap>0?'Năng lực sản xuất đang biến đổi nhanh hơn mức thích ứng của quan hệ sản xuất.':'Cấu trúc quan hệ chưa tương ứng với năng lực sản xuất hiện có.'}</p></div><div className="lab-presets"><button onClick={()=>preset('fit')}>CÂN BẰNG</button><button onClick={()=>preset('ahead')}>LLSX VƯỢT TRƯỚC</button><button onClick={()=>preset('rigid')}>QHSX CỨNG</button><button onClick={()=>preset('adapt')}>TÁI CẤU TRÚC <span>↗</span></button></div><small>Mô phỏng khái niệm — không phải mô hình định lượng.</small></div>
  </section>
}

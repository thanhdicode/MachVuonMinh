import { useRef, useState } from 'react'
import { installToken, policyResult, tokens } from './model'
import { tick, useWorld } from './WorldState'

export function PolicyChamber() {
  const slots=useWorld(s=>s.slots),set=useWorld(s=>s.set)
  const [dragging,setDragging]=useState<number|null>(null),[dropSlot,setDropSlot]=useState<number|null>(null),[message,setMessage]=useState('')
  const start=useRef({x:0,y:0}),ghost=useRef<HTMLDivElement>(null),suppressClick=useRef(false)
  const activeDrag=useRef<number|null>(null)
  const result=policyResult(slots),complete=slots.every(x=>x!==null)
  const install=(token:number,slot:number)=>{set({slots:installToken(slots,token,slot)});tick(330+token*35);setMessage(`${tokens[token]} đã gắn vào vị trí ${slot+1}.`)}
  const quickInstall=(token:number)=>{
    if(slots.includes(token)){setMessage('Đòn bẩy này đã được gắn. Chạm vị trí để tháo.');return}
    const empty=slots.indexOf(null)
    if(empty!==-1)install(token,empty)
    else setMessage('Đã đủ ba đòn bẩy. Tháo một đòn bẩy hoặc kéo để thay thế.')
  }
  const hitSlot=(x:number,y:number)=>{
    const target=document.elementFromPoint(x,y)?.closest<HTMLElement>('[data-slot]')
    return target?Number(target.dataset.slot):null
  }
  return <section className={`policy-overlay ${dragging!==null?'is-dragging':''} ${complete?'is-complete':''}`} aria-label="Buồng chính sách">
    <div className="policy-title"><span className="eyebrow">07 / BUỒNG CHÍNH SÁCH</span><h2>Ba đòn bẩy.<br/>Một hệ thống.</h2><p>Chọn ba đòn bẩy.<br/>Không có một đáp án duy nhất.</p></div>
    <p className="policy-instruction">CHỌN 3 ĐÒN BẨY<br/>VÀ GẮN VÀO HỆ THỐNG<small>Kéo vào vòng · Hoặc chạm để gắn<br/>Chạm vị trí đã gắn để tháo</small></p>
    <div className="policy-sockets">{slots.map((token,i)=><button className={`policy-socket socket-${i} ${token!==null?'filled':''} ${dropSlot===i?'receiving':''}`} key={i} data-slot={i} aria-label={`Vị trí ${i+1}${token!==null?': '+tokens[token]+'. Nhấn để tháo.':': trống'}`} onClick={()=>{if(token!==null){set({slots:slots.map((v,j)=>j===i?null:v)});setMessage(`Đã tháo ${tokens[token]}.`)}}}><span>{dropSlot===i?'+':token!==null?'↗':String(i+1).padStart(2,'0')}</span><small>{dropSlot===i?'THẢ ĐỂ GẮN':token!==null?tokens[token]:'GẮN ĐÒN BẨY'}</small></button>)}</div>
    {complete&&<div className="policy-result" aria-live="polite"><p><span>MẠNH Ở</span>{result.strength}.</p><p><span>CÒN THIẾU</span>{result.missing}</p><p><span>ĐÁNH ĐỔI</span>{result.tradeoff}</p></div>}
    <div className="policy-tokens">{tokens.map((name,i)=><button key={name} className={`lever-token ${slots.includes(i)?'installed':''}`} aria-pressed={slots.includes(i)}
      onClick={e=>{if(suppressClick.current&&e.detail!==0){suppressClick.current=false;return}suppressClick.current=false;quickInstall(i)}}
      onPointerDown={e=>{if(e.button!==0)return;start.current={x:e.clientX,y:e.clientY};suppressClick.current=false;activeDrag.current=i;setDragging(i);e.currentTarget.setPointerCapture(e.pointerId)}}
      onPointerMove={e=>{if(activeDrag.current!==i)return;if(ghost.current)ghost.current.style.transform=`translate(${e.clientX+12}px,${e.clientY-25}px)`;setDropSlot(hitSlot(e.clientX,e.clientY))}}
      onPointerCancel={()=>{activeDrag.current=null;setDragging(null);setDropSlot(null);suppressClick.current=false}}
      onPointerUp={e=>{
        if(activeDrag.current!==i)return
        activeDrag.current=null;setDragging(null);setDropSlot(null)
        const moved=Math.hypot(e.clientX-start.current.x,e.clientY-start.current.y)>=7
        suppressClick.current=moved
        if(!moved)return
        const slot=hitSlot(e.clientX,e.clientY)
        if(slot!==null)install(i,slot)
        else setMessage('Kéo đòn bẩy vào một trong ba vòng để gắn.')
      }}><span className="token-code">{String(i+1).padStart(2,'0')} <i/></span><strong>{name}</strong><span className="token-grip">⠿</span></button>)}</div>
    {dragging!==null&&<div className="token-ghost" ref={ghost} style={{transform:`translate(${start.current.x+12}px,${start.current.y-25}px)`}}>{tokens[dragging]}</div>}
    <p className="policy-message" aria-live="polite">{dragging!==null?'Đưa đòn bẩy tới một vòng để xem vị trí gắn.':message||'Mỗi lựa chọn mở một khả năng — và để lại một đánh đổi.'}</p>
  </section>
}

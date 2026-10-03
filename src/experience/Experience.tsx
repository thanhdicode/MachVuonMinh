import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useWorld, tick, timeline } from './WorldState'
import { startTimeline, goToScene } from './WorldTimeline'
import { sceneCopy } from '../data/copy'
import { LabControls } from './LabControls'
import { VietnamEvidence } from './VietnamEvidence'
import { SourceDrawer } from './SourceDrawer'
import { PolicyChamber } from './PolicyChamber'
import { HistoryBridge } from './HistoryBridge'
import { MachineChapter } from './MachineChapter'
const WorldCanvas = lazy(() => import('./WorldCanvas'))
const MiniGame = lazy(() => import('../minigame/MiniGame'))
export function Experience() {
  const state = useWorld(), dragStart = useRef<{x:number;y:number}|null>(null)
  const [drawer,setDrawer]=useState<'menu'|'source'|'history'|null>(null), [source,setSource]=useState(0)
  const [miniGameOpen,setMiniGameOpen]=useState(false)
  const closeMiniGame=useCallback(()=>setMiniGameOpen(false),[])
  const openSource=(index:number)=>{setSource(index);setDrawer('source')}
  const openHistorySource=(index:number)=>{setSource(index);setDrawer('history')}
  useEffect(startTimeline, [])
  useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>useWorld.getState().set({reduced:media.matches});media.addEventListener('change',update);return()=>media.removeEventListener('change',update)},[])
  useEffect(() => { document.body.classList.toggle('locked', !state.unlocked); return()=>document.body.classList.remove('locked') }, [state.unlocked])
  const unlock = () => { if (!state.unlocked) { state.set({unlocked:true}); tick(420) } }
  return <main className={`experience scene-${state.active} ${state.unlocked?'unlocked':''} ${state.history?'history-active':''} ${state.machine?'machine-active':''}`}>
    <Suspense fallback={<div className="loading-thread">Đang nối mạch…</div>}><WorldCanvas suspended={miniGameOpen} /></Suspense>
    <div className="paper-grain" />
    <header className="minimal-nav"><a className="wordmark" href="#" onClick={e=>{e.preventDefault();goToScene(0)}}><span className="brand-symbol">m.</span><span>MẠCH<br/>VƯƠN MÌNH</span></a><div className="nav-end"><span>{state.history?'01 / H':String(state.active).padStart(2,'0')+' / 08'}</span><button aria-label="Mở mục lục" className="menu-trigger" onClick={()=>setDrawer('menu')}>☰</button></div></header>
    {state.active===0 && <section className="intro-overlay" aria-label="Kích hoạt sợi đỏ">
      <p className="eyebrow intro-label">TRIẾT HỌC MÁC–LÊNIN / LLSX & QHSX</p>
      {!state.unlocked&&<span className="eyelet-target" role="img" aria-label="Vòng kim loại — đích kéo sợi đỏ"/>}
      {!state.unlocked ? <><div className="eyelet-label"><span>QUAN HỆ / CẤU TRÚC</span><i/><span>SỢI ĐỎ / NĂNG LỰC SẢN XUẤT</span></div><button className="thread-handle" aria-label="Kéo sợi đỏ qua vòng. Hoặc nhấn Enter để tiếp tục." onPointerDown={e=>{dragStart.current={x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);timeline.dragging=true;timeline.endpoint=[e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2]}} onPointerMove={e=>{if(!dragStart.current)return;timeline.endpoint=[e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2];e.currentTarget.style.left=e.clientX+'px';e.currentTarget.style.top=e.clientY+'px'}} onPointerCancel={e=>{dragStart.current=null;timeline.dragging=false;e.currentTarget.style.left='';e.currentTarget.style.top=''}} onPointerUp={e=>{const start=dragStart.current; if(start && (Math.hypot(e.clientX-start.x,e.clientY-start.y)<12 || (e.clientX>innerWidth*.4&&e.clientX<innerWidth*.7&&e.clientY>innerHeight*.25&&e.clientY<innerHeight*.65))) unlock();dragStart.current=null;timeline.dragging=false;e.currentTarget.style.left='';e.currentTarget.style.top=''}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();unlock()}}}><span>↗</span></button><div className="intro-prompt"><p>KÉO SỢI ĐỎ QUA VÒNG</p><span>Kéo để kết nối · Chạm hoặc Enter để tiếp tục</span></div></> : <><div className="ink-reveal"/><div className="hero-title"><span className="eyebrow">VIỆT NAM / NĂNG LỰC MỚI, QUAN HỆ MỚI</span><h1>MẠCH<br/><em>VƯƠN MÌNH</em></h1><p>Điều gì xảy ra khi cách chúng ta sản xuất thay đổi nhanh hơn cách xã hội tổ chức sản xuất?</p></div><button className="next-cue" onClick={()=>goToScene(1)}>CUỘN ĐỂ THEO SỢI ĐỎ <span>↓</span></button></>}
    </section>}
    {!state.history && state.active!==2 && sceneCopy[state.active] && <section className={`scene-copy copy-${state.active}`} key={state.active} aria-label={sceneCopy[state.active].code}><span className="eyebrow">{sceneCopy[state.active].code}</span><h2>{sceneCopy[state.active].title}</h2>{!([4,8].includes(state.active)&&state.beat===1)&&<p>{sceneCopy[state.active].body}</p>}<div className="specimen-caption"><span className="caption-line"/>{sceneCopy[state.active].note}</div></section>}
    {state.active===1 && !state.history && <div className="world-annotation annotation-soil"><span>VẬT MẪU 01.A</span><strong>Lưỡi cày</strong><p>Một giới hạn vật chất.<br/>Một chân trời sản xuất.</p></div>}
    {state.active===3 && <><div className="automation-control"><label htmlFor="automation">MỨC TỰ ĐỘNG HÓA <output>{state.automation}%</output></label><input id="automation" type="range" min="0" max="100" value={state.automation} onChange={e=>state.set({automation:Number(e.target.value)})}/><div className="range-ends"><span>THAO TÁC</span><span>TRI THỨC</span></div></div><div className="role-nodes"><span style={{opacity:1-state.automation*.007}}><i style={{transform:`scale(${1-state.automation*.005})`}}/>Thao tác</span><span><i style={{transform:`scale(${.6+state.automation*.008})`}}/>Giám sát</span><span style={{opacity:.35+state.automation*.0065}}><i style={{transform:`scale(${.4+state.automation*.012})`}}/>Thiết kế & cải tiến</span></div></>}
    {state.active===4 && <>{state.beat===1&&<p className="data-question">Ai sở hữu? <i/> Ai tổ chức? <i/> Giá trị được phân phối thế nào?</p>}</>}
    {state.active===5 && <LabControls/>}
    {state.active===6 && <VietnamEvidence openSource={openSource}/>}
    {state.active===7 && <PolicyChamber/>}
    {state.active===8 && <div className="final-actions">{state.beat===1&&<p>Đổi mới công cụ. Đổi mới quan hệ. Để con người cùng vươn mình.</p>}<button className="final-game-trigger" onClick={()=>setMiniGameOpen(true)}>CHƠI MINIGAME <span aria-hidden="true">↗</span></button><small className="final-game-note">5 GIAI ĐOẠN · 5 BOSS · 77 CÂU HỎI</small><div><button onClick={()=>goToScene(5)}>THỬ LẠI LAB <span>↗</span></button><button onClick={()=>openSource(0)}>XEM NGUỒN <span>↗</span></button></div></div>}
    {miniGameOpen && <Suspense fallback={<div className="mini-game-loading" role="status">Đang mở hành trình ôn tập…</div>}><MiniGame onClose={closeMiniGame} /></Suspense>}
    {drawer && <SourceDrawer mode={drawer} index={source} onClose={()=>setDrawer(null)} onSource={drawer==='history'?openHistorySource:openSource}/>}
    <footer className="exhibit-footer"><span>MLN111 <i/> LỰC LƯỢNG SẢN XUẤT × QUAN HỆ SẢN XUẤT</span><span>TRẢI NGHIỆM 03—04 PHÚT</span></footer>
    <div className="journey-before" aria-hidden="true" /><HistoryBridge openSource={openHistorySource}/><MachineChapter/><div className="journey-after" aria-hidden="true" />
  </main>
}



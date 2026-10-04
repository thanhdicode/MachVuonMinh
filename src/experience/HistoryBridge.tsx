import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { historyEras, historyBridgeLine, historyImage } from '../data/history'
import { lensGeometry, historyStep, historyProgressForTravel } from './historyGeometry'
import { acquireScrollLease, goToScene, scrollToPosition } from './WorldTimeline'
import { useGuideControls } from '../onboarding/guideControls'
import { useWorld } from './WorldState'
import { useHistoryAudio } from './useHistoryAudio'
import './history.css'

gsap.registerPlugin(ScrollTrigger)
const step=historyStep
const horizontalMedia='(min-width:900px) and (prefers-reduced-motion:no-preference)'
// Normalized locations on the original cutouts: actual tools/infrastructure, not decorative points.
const featureAnchors=[[.35,.35],[.3,.5],[.4,.58],[.58,.56],[.43,.57],[.72,.29],[.43,.29],[.66,.38]]
const fragmentPositions=['65% 75%','70% 56%','45% 70%','75% 55%','65% 65%','80% 35%','26% 36%']
const foregroundOffsets=[0,2,0,2,0,1,-1,0]
function LoupeIcon() {
  return <svg viewBox="0 0 32 32" aria-hidden="true"><g className="history-tool-ring"><circle cx="13" cy="13" r="9"/><circle className="history-tool-highlight" cx="13" cy="13" r="7.5"/><path d="M19.5 19.5L29 29M23 24L26 27"/></g><circle className="history-tool-mark" cx="13" cy="4" r="1.4"/></svg>
}

export function HistoryBridge({openSource}: {openSource:(index:number)=>void}) {
  const root=useRef<HTMLElement>(null), track=useRef<HTMLDivElement>(null), lens=useRef<HTMLDivElement>(null)
  const zoom=useRef<HTMLDialogElement>(null), zoomTrigger=useRef<HTMLElement|null>(null), inspectButton=useRef<HTMLButtonElement>(null)
  const press=useRef<{timer:ReturnType<typeof setTimeout>;x:number;y:number}|null>(null)
  const tween=useRef<gsap.core.Tween|null>(null),lensTo=useRef<{x:gsap.QuickToFunc;y:gsap.QuickToFunc}|null>(null)
  const [active,setActive]=useState(0),[loaded,setLoaded]=useState<number[]>([]),[zoomed,setZoomed]=useState<number|null>(null),[inspecting,setInspecting]=useState(false)
  const reduced=useWorld(s=>s.reduced),paused=useWorld(s=>s.paused),inHistory=useWorld(s=>s.history)
  const audio=useHistoryAudio(active,inHistory)
  const activeRef=useRef(active);activeRef.current=active
  const updateLeader=()=>{
    const el=root.current,i=activeRef.current
    if(!el||!matchMedia(horizontalMedia).matches)return
    const img=el.querySelector<HTMLImageElement>(`[data-label-era="${i}"] .history-image img`),copy=el.querySelector<HTMLElement>('.history-curator .history-body'),path=el.querySelector<SVGPathElement>('.history-leader path'),dot=el.querySelector<SVGRectElement>('.history-leader rect')
    if(!img?.naturalWidth||!copy||!path||!dot)return
    const r=img.getBoundingClientRect(),bounds=el.getBoundingClientRect(),c=copy.getBoundingClientRect(),scale=Math.min(r.width/img.naturalWidth,r.height/img.naturalHeight)
    const w=img.naturalWidth*scale,h=img.naturalHeight*scale,ax=r.left+(r.width-w)/2+w*featureAnchors[i][0]-bounds.left,ay=r.bottom-h+h*featureAnchors[i][1]-bounds.top
    const tx=c.left-bounds.left-14,ty=c.bottom-bounds.top+13
    path.setAttribute('d',`M${ax} ${ay}V${ty}H${tx}`);dot.setAttribute('x',String(ax-2));dot.setAttribute('y',String(ay-2))
    el.dataset.anchor=`${ax.toFixed(1)},${ay.toFixed(1)}`
  }
  useEffect(()=>{
    const el=root.current;if(!el)return
    const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setLoaded([0,1,2]);observer.disconnect()}},{rootMargin:'100% 0px'})
    observer.observe(el);return()=>observer.disconnect()
  },[])
  useEffect(()=>{setLoaded(previous=>previous.length?[...new Set([...previous,active,active+1,active+2].filter(i=>i<8))]:previous)},[active])
  useEffect(()=>{
    const el=root.current;if(!el)return
    const observer=new IntersectionObserver(entries=>{if(matchMedia(horizontalMedia).matches)return;entries.forEach(e=>{if(e.isIntersecting)setActive(Number((e.target as HTMLElement).dataset.labelEra))})},{rootMargin:'-18% 0px -60% 0px',threshold:0})
    el.querySelectorAll('.era-stage').forEach(n=>observer.observe(n));return()=>observer.disconnect()
  },[reduced])
  useLayoutEffect(()=>{
    const el=root.current,world=track.current;if(!el||!world)return
    const media=gsap.matchMedia()
    media.add({desktop:'(min-width:900px)',mobile:'(max-width:899px)',reducedMotion:'(prefers-reduced-motion:reduce)'},context=>{
      if(context.conditions!.mobile||context.conditions!.reducedMotion){el.dataset.layout='vertical';setInspecting(false);return()=>{delete el.dataset.layout}}
      el.dataset.layout='horizontal'
      const distance=()=>world.scrollWidth-el.clientWidth
      const animation=gsap.to(world,{x:()=>-distance(),ease:'none',scrollTrigger:{id:'history-bridge',trigger:el,start:'top top',end:()=>`+=${distance()}`,pin:true,scrub:.85,invalidateOnRefresh:true,anticipatePin:1,refreshPriority:1},onUpdate:function(this:gsap.core.Tween){
        updateLeader()
        const travel=this.progress()*distance()
        if(innerWidth<1440)el.querySelectorAll<HTMLElement>('.history-figure').forEach((figure,i)=>figure.style.setProperty('--art-clip',`${Math.max(0,travel-i*step/100*innerWidth)}px`))
        const p=Math.max(0,Math.min(1,(this.progress()-.91)/.09))
        el.style.setProperty('--atlas-handoff',String(p));el.dataset.handoff=p>.05?'true':'false';el.dataset.bridgeReady=p>.75?'true':'false'
        if(p>.05&&lens.current)lens.current.style.opacity='0'
      }})
      tween.current=animation
      const triggers=historyEras.map((_,i)=>ScrollTrigger.create({trigger:el.querySelector(`[data-label-era="${i}"] .history-era-sentinel`),containerAnimation:animation,start:'left 48%',end:'right 48%',onEnter:()=>setActive(i),onEnterBack:()=>setActive(i),onLeaveBack:()=>setActive(Math.max(0,i-1))}))
      const ticker=()=>{if(useWorld.getState().history)updateLeader()};gsap.ticker.add(ticker)
      return()=>{triggers.forEach(t=>t.kill());gsap.ticker.remove(ticker);tween.current=null;delete el.dataset.layout;delete el.dataset.handoff;delete el.dataset.bridgeReady;el.style.removeProperty('--atlas-handoff')}
    })
    return()=>media.revert()
  },[])
  useEffect(()=>{
    const el=root.current;if(!el)return
    const figures=Array.from(el.querySelectorAll<HTMLElement>('.history-figure'))
    figures.forEach((figure,i)=>{figure.querySelector('button')!.tabIndex=i===active?0:-1;gsap.to(figure,{opacity:i===active?1:.62,filter:`saturate(${i===active?1:.72})`,duration:.75,overwrite:true})})
    const node=el.querySelector(`[data-rail-era="${active}"]`)
    if(node&&!reduced&&!paused)gsap.fromTo(node,{scale:1},{scale:1.35,duration:.2,repeat:1,yoyo:true,transformOrigin:'center'})
    updateLeader()
    const path=el.querySelector('.history-leader path')
    if(path&&!reduced)gsap.fromTo(path,{strokeDasharray:1,strokeDashoffset:1},{strokeDashoffset:0,duration:.4,overwrite:true})
  },[active,reduced,paused])
  useEffect(()=>{
    const node=lens.current
    if (!node || reduced || !matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const context=gsap.context(()=>{lensTo.current={x:gsap.quickTo(node,'x',{duration:.15,ease:'power2.out'}),y:gsap.quickTo(node,'y',{duration:.15,ease:'power2.out'})}})
    const hide=()=>{node.style.opacity='0'}
    window.addEventListener('scroll',hide,{passive:true})
    window.addEventListener('resize',hide)
    return ()=>{window.removeEventListener('scroll',hide);window.removeEventListener('resize',hide);context.revert();lensTo.current=null}
  },[reduced])
  useEffect(()=>{
    const node=lens.current,button=inspectButton.current
    if (!node || !button) return
    const dock=button.getBoundingClientRect(),x=dock.left+dock.width/2-95,y=dock.top+dock.height/2-95
    const toolTween=gsap.to(button,{rotation:inspecting?12:0,x:inspecting?-5:0,y:inspecting?-7:0,scale:inspecting?1.1:1,duration:reduced?0:.3,ease:'power2.out'})
    let returnTween:gsap.core.Tween|undefined
    if (inspecting) gsap.set(node,{x,y,scale:.25,opacity:0})
    else {
      const hasSource=!!node.dataset.loupeSrc
      node.style.backgroundImage='none';delete node.dataset.loupeSrc
      if (hasSource) gsap.set(node,{opacity:.25})
      returnTween=gsap.to(node,{x,y,scale:.25,opacity:0,duration:reduced?0:.32,ease:'power2.inOut'})
    }
    return ()=>{toolTween.kill();returnTween?.kill()}
  },[inspecting,reduced])
  useEffect(()=>{if(lens.current)lens.current.style.opacity='0';if(active===7 && root.current?.dataset.handoff==='true' || reduced || !inHistory)setInspecting(false)},[active,reduced,inHistory])

  const stepEra=(index:number)=>{
    const el=root.current, animation=tween.current
    if (!el) return
    if (animation?.scrollTrigger) {
      const trigger=animation.scrollTrigger, travel=Math.min((index*step/100+.01)*innerWidth,(track.current?.scrollWidth ?? 0)-el.clientWidth)
      const progress=historyProgressForTravel(travel,(track.current?.scrollWidth ?? 0)-el.clientWidth)
      scrollToPosition(trigger.start+progress*(trigger.end-trigger.start))
    } else {
      const target=el.querySelector<HTMLElement>(`[data-label-era="${index}"]`)
      if (target) scrollToPosition(target.getBoundingClientRect().top+window.scrollY-110,true)
    }
  }
  useEffect(()=>{
    const key=(event:KeyboardEvent)=>{
      if (!useWorld.getState().history || document.querySelector('dialog[open]') || /INPUT|TEXTAREA|SELECT/.test((event.target as HTMLElement)?.tagName)) return
      if (document.querySelector('.driver-overlay,.mach-guide-options[data-open]')) return
      if (event.key==='Escape' && inspecting) {event.preventDefault();event.stopPropagation();setInspecting(false);inspectButton.current?.focus({preventScroll:true});return}
      if (tween.current && (event.key==='ArrowRight' || event.key==='ArrowLeft')) {event.preventDefault();stepEra(Math.max(0,Math.min(7,active+(event.key==='ArrowRight'?1:-1))))}
    }
    window.addEventListener('keydown',key,true)
    return ()=>window.removeEventListener('keydown',key,true)
  },[active,inspecting])

  const magnify=(event:ReactPointerEvent<HTMLButtonElement>)=>{
    if (press.current && Math.hypot(event.clientX-press.current.x,event.clientY-press.current.y)>10) cancelPress()
    if (!inspecting || event.currentTarget.dataset.inspectable!=='true' || event.pointerType!=='mouse' || !lensTo.current || reduced || !tween.current) return
    const img=event.currentTarget.querySelector('img'), node=lens.current
    if (!img?.naturalWidth || !node) return
    const [alignX,alignY]=getComputedStyle(img).objectPosition.split(' ').map(value=>parseFloat(value)/100)
    const rect=img.getBoundingClientRect(),scale=Math.min(rect.width/img.naturalWidth,rect.height/img.naturalHeight),left=rect.left+(rect.width-img.naturalWidth*scale)*alignX,top=rect.top+(rect.height-img.naturalHeight*scale)*alignY
    if (event.clientX<left || event.clientX>left+img.naturalWidth*scale || event.clientY<top || event.clientY>top+img.naturalHeight*scale) {node.style.opacity='0';return}
    const src=event.currentTarget.dataset.loupeSrc
    if (!src) {node.style.opacity='0';node.style.backgroundImage='none';delete node.dataset.loupeSrc;return}
    const geometry=lensGeometry(rect,img.naturalWidth,img.naturalHeight,event.clientX,event.clientY,alignX,alignY)
    if (node.dataset.loupeSrc!==src) {node.dataset.loupeSrc=src;node.style.backgroundImage=`url("${src}")`}
    node.style.backgroundSize=`${geometry.width}px ${geometry.height}px`
    node.style.backgroundPosition=`${geometry.x}px ${geometry.y}px`
    if (node.style.opacity==='0') gsap.to(node,{opacity:1,scale:1,duration:.16,overwrite:'auto'})
    lensTo.current.x(event.clientX-95);lensTo.current.y(event.clientY-95)
  }
  const cancelPress=()=>{if(press.current)clearTimeout(press.current.timer);press.current=null}
  const openInspection=(target:HTMLElement,index:number)=>{zoomTrigger.current=target;setZoomed(index);if(lens.current)lens.current.style.opacity='0'}
  useGuideControls('history',{openZoom:(index)=>openInspection(inspectButton.current??root.current as HTMLElement,index),closeZoom:()=>setZoomed(null),zoomOpen:()=>zoomed!==null})
  const toggleInspection=(target:HTMLButtonElement)=>{
    if (reduced || !matchMedia(horizontalMedia).matches || !matchMedia('(hover:hover) and (pointer:fine)').matches) openInspection(target,Math.min(7,active))
    else setInspecting(value=>!value)
  }
  const startPress=(event:ReactPointerEvent<HTMLButtonElement>,index:number)=>{
    if (event.pointerType==='mouse') return
    const target=event.currentTarget
    press.current={x:event.clientX,y:event.clientY,timer:setTimeout(()=>{zoomTrigger.current=target;setZoomed(index);press.current=null},500)}
  }
  useEffect(()=>()=>{if(press.current)clearTimeout(press.current.timer)},[])
  useEffect(()=>{
    const dialog=zoom.current
    if (zoomed===null || !dialog) return
    dialog.showModal();document.body.classList.add('drawer-open')
    const release=acquireScrollLease('dialog')
    return ()=>{dialog.close();release();document.body.classList.remove('drawer-open');zoomTrigger.current?.focus({preventScroll:true})}
  },[zoomed])

  return <div className="history-insertion">
    <section ref={root} data-active-era={active} data-era={active} className={`history-bridge ${reduced?'history-static':''} ${paused?'history-paused':''} ${inspecting?'history-inspecting':''}`} aria-labelledby="history-title" tabIndex={0}>
      <div className="history-copy-stack">
        <div className="history-heading" data-guide="history-overview"><span className="eyebrow">01 / MỘT QUÃNG NHÌN LẠI</span><h2 id="history-title">BẢN ĐỒ LỊCH SỬ <span>LỰC LƯỢNG SẢN XUẤT VIỆT NAM</span></h2></div>
        <div className="history-curator" data-guide="history-caption" key={active}><div className="history-title-block"><span className="history-year"><small>{String(active+1).padStart(2,'0')} / </small>{historyEras[active].year}</span><h3>{historyEras[active].title}</h3></div><div className="history-body"><p>{historyEras[active].body[0]}</p></div></div>
      </div>
      <div ref={track} className="atlas-world">
        <picture className="atlas-panorama"><source media="(max-width:899px), (prefers-reduced-motion:reduce)" srcSet="/history/atlas-panorama-mobile-1024x8192.webp"/><source media="(max-width:1400px)" srcSet="/history/atlas-panorama-4096.webp"/><img src="/history/atlas-panorama-8192.avif" alt="" aria-hidden="true" decoding="async"/></picture>
        <div className="history-track">
          {historyEras.map((era,i)=><article key={era.id} className={`era-stage ${i===active?'history-current':''}`} data-label-era={i} data-status={i===active?'active':'neighbor'} style={{'--era':i} as CSSProperties}>
            <span className="history-era-sentinel" aria-hidden="true"/>
            <div className="history-mobile-copy" data-guide="history-era-nav history-next-prev history-caption"><span className="history-year">{era.year}</span><h3>{era.title}</h3><div className="history-body"><p>{era.body[0]}</p></div></div>
            <figure className="history-figure" style={{'--foreground-offset':`${foregroundOffsets[i]}vw`} as CSSProperties}><button className="history-image" data-inspectable="true" data-loupe-src={historyImage(era.id,'zoom')} aria-label={`Phóng ảnh: ${era.title}`} onPointerDown={e=>startPress(e,i)} onPointerUp={cancelPress} onPointerCancel={cancelPress} onPointerMove={magnify} onPointerLeave={()=>{cancelPress();if(lens.current)lens.current.style.opacity='0'}} onClick={e=>openInspection(e.currentTarget,i)}>
              <img src={loaded.includes(i)?historyImage(era.id,1440):undefined} srcSet={loaded.includes(i)?`${historyImage(era.id,768)} 768w, ${historyImage(era.id,1440)} 1440w`:undefined} sizes="(max-width:899px) 100vw, 90vw" alt={era.alt} decoding="async" onLoad={updateLeader}/>
            </button></figure>
            {i<7&&<div className="history-continuity-fragment" aria-hidden="true"><img src={loaded.includes(i+1)?historyImage(historyEras[i+1].id,768):undefined} alt="" style={{objectPosition:fragmentPositions[i]}}/></div>}
            <div className="history-mobile-facts">{era.metric&&<strong className="history-metric">{era.metric}</strong>}<p>{era.caption||era.tag}</p>{era.secondary&&<p>{era.secondary}</p>}<button className="history-source" onClick={()=>openSource(i)} aria-label={`Đối chiếu tư liệu ${era.year}`}>ĐỐI CHIẾU TƯ LIỆU ↗</button><button className="history-mobile-inspect" data-guide="history-inspect" aria-label={`Soi chi tiết ${era.year}`} aria-pressed={zoomed===i} onClick={e=>openInspection(e.currentTarget,i)}><LoupeIcon/> SOI CHI TIẾT</button></div>
          </article>)}
        </div>
        <div className="history-progress-rail" data-guide="history-era-nav" aria-label="Mốc lịch sử"><div className="history-rail-line"/>{historyEras.map((era,i)=><button key={era.id} data-rail-era={i} className={i===active?'history-current':''} aria-label={`Đến thời kỳ ${era.year}`} aria-current={i===active?'step':undefined} onClick={()=>stepEra(i)} style={{left:`${48+i*step}vw`,'--rail-era':i} as CSSProperties}><i/><span>{era.year}</span></button>)}</div>
      </div>
      <svg className="history-leader" aria-hidden="true"><path pathLength="1"/><rect width="4" height="4"/></svg>
      <div className="history-fact-rail" key={`facts-${active}`}><div>{historyEras[active].metric&&<strong className="history-metric">{historyEras[active].metric}</strong>}<button className="history-source" onClick={()=>openSource(active)} aria-label={`Đối chiếu tư liệu ${historyEras[active].year}`}>ĐỐI CHIẾU TƯ LIỆU ↗</button></div><div className="history-fact-detail"><p>{historyEras[active].caption||historyEras[active].tag}</p>{historyEras[active].secondary&&<p>{historyEras[active].secondary}</p>}</div></div>
      <div className="history-direct-transition"><img className="atlas-machine-anchor" src="/history/atlas-machine-anchor.webp" alt="Chi tiết bánh đà trong panorama"/><img className="atlas-machine-hall" src="/images/machine-hall/hall.webp" alt=""/><button data-guide="history-machine-cta" onClick={()=>goToScene(2)}>{historyBridgeLine}<span>↗</span></button></div>
      <div className="history-controls"><span className="history-hint">CUỘN ĐỂ ĐI QUA LỊCH SỬ ↓</span><button className="history-sound" data-guide="history-audio" data-audio-context={audio.contextState} data-audio-rms={audio.rms} data-audio-peak={audio.peak} data-audio-era={audio.era} aria-label={audio.enabled?'Tắt âm thanh lịch sử':'Bật âm thanh lịch sử'} aria-pressed={audio.enabled} onClick={audio.toggle}><span aria-hidden="true">{audio.enabled?'◖))':'◖×'}</span><small>ÂM THANH {audio.enabled?'BẬT':'TẮT'}</small></button><div data-guide="history-next-prev"><button onClick={()=>stepEra(Math.max(0,active-1))} disabled={active===0} aria-label="Thời kỳ trước">←</button><span>{String(active+1).padStart(2,'0')} / 08</span><button onClick={()=>stepEra(Math.min(7,active+1))} disabled={active===7} aria-label="Thời kỳ tiếp theo">→</button></div></div>
      {audio.error&&<p className="history-audio-error" role="status">{audio.error} Bấm để thử lại.</p>}
      <div className="history-loupe-dock"><button ref={inspectButton} className="history-inspect" data-guide="history-inspect" aria-label="Bật kính lúp xem chi tiết" aria-pressed={inspecting} title="SOI CHI TIẾT · Esc để tắt" onClick={e=>toggleInspection(e.currentTarget)}><LoupeIcon/></button><span>SOI CHI TIẾT</span></div>
      <div ref={lens} className="history-lens" aria-hidden="true"><i/><i/><i/><i/><span>2.15×</span></div>
    </section>
    <dialog ref={zoom} className="history-zoom" aria-label={zoomed===null?'Ảnh lịch sử':historyEras[zoomed].title} onCancel={()=>setZoomed(null)} onClick={e=>{if(e.target===e.currentTarget)setZoomed(null)}} data-lenis-prevent>{zoomed!==null&&<><header><span className="eyebrow">{historyEras[zoomed].year} / MINH HỌA TÁI DỰNG</span><button onClick={()=>setZoomed(null)} aria-label="Đóng ảnh phóng lớn">×</button></header><div className="history-zoom-scroll" data-guide="history-inspect" data-lenis-prevent><img src={historyImage(historyEras[zoomed].id,'zoom')} alt={historyEras[zoomed].alt}/></div><p>{historyEras[zoomed].title}</p></>}</dialog>
  </div>
}

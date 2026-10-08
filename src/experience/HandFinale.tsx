import {useEffect,useLayoutEffect,useRef,useState} from 'react'
import gsap from 'gsap'
import {ScrollTrigger} from 'gsap/ScrollTrigger'
import {HAND_ASSETS,handLayout} from './handFinaleGeometry'
import {goToScene} from './WorldTimeline'
import './handFinale.css'

gsap.registerPlugin(ScrollTrigger)
const threads=[
  'M0 0C-90 -18 -120 -86 -240 -62S-440 -25 -610 -100',
  'M0 0C-85 15 -155 102 -270 83S-470 34 -610 140',
  'M0 0C-75 -32 -140 30 -245 2S-470 -45 -610 -20',
  'M0 0C85 -22 160 -98 275 -62S455 -18 610 -115',
  'M0 0C92 25 154 93 270 71S465 25 610 120',
  'M0 0C88 -28 152 15 263 1S469 -42 610 -15',
]
const particles=[[-340,-56],[-430,73],[-220,6],[-540,-24],[350,-52],[440,64],[230,3],[540,-21]]

export function HandFinale(){
  const root=useRef<HTMLElement>(null),runway=useRef<HTMLDivElement>(null),stage=useRef<HTMLDivElement>(null)
  const [assets,setAssets]=useState<'waiting'|'ready'|'failed'>('waiting')
  useEffect(()=>{
    let cancelled=false,requested=false
    const load=()=>{
      if(requested)return;requested=true
      void Promise.all(Object.values(HAND_ASSETS).map(asset=>{
        const image=new Image();image.decoding='async';image.src=asset.src
        return image.decode()
      })).then(()=>{if(!cancelled)setAssets('ready')},()=>{if(!cancelled)setAssets('failed')})
    }
    const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){load();observer.disconnect()}},{rootMargin:'100% 0px'})
    observer.observe(root.current!)
    return()=>{cancelled=true;observer.disconnect()}
  },[])
  useLayoutEffect(()=>{
    const el=root.current!,view=stage.current!,track=runway.current!,media=gsap.matchMedia()
    media.add({reduce:'(prefers-reduced-motion: reduce)',normal:'(prefers-reduced-motion: no-preference)'},context=>{
      const staticMode=!!context.conditions?.reduce||assets==='failed'
      el.dataset.layout=staticMode?'static':'pinned'
      const human=view.querySelector<HTMLElement>('.finale-human')!,robot=view.querySelector<HTMLElement>('.finale-robot')!
      const layout=()=>handLayout(view.clientWidth,view.clientHeight)
      const hands=view.querySelector('.finale-hands')!,pulse=view.querySelector('.finale-pulse')!,point=view.querySelector('.finale-contact')!
      const statement=view.querySelector('.finale-statement')!,cue=view.querySelector('.finale-scroll-cue')!
      const rays=view.querySelectorAll('.finale-thread'),dots=view.querySelectorAll('.finale-particle')
      const place=(name:'human'|'robot')=>({x:()=>layout().hands[name].x,y:()=>layout().hands[name].y,rotation:0})
      if(staticMode){
        gsap.set(human,place('human'));gsap.set(robot,place('robot'))
        gsap.set(hands,{y:()=>-view.clientHeight*.11})
        gsap.set(statement,{autoAlpha:1,y:0});gsap.set(cue,{autoAlpha:0})
        gsap.set(point,{opacity:1});gsap.set(pulse,{opacity:0});gsap.set(rays,{strokeDashoffset:0,opacity:.35})
        el.dataset.progress='1'
        const resize=()=>{gsap.set(human,place('human'));gsap.set(robot,place('robot'));gsap.set(hands,{y:-view.clientHeight*.11})}
        window.addEventListener('resize',resize)
        const refreshFrame=requestAnimationFrame(()=>ScrollTrigger.refresh())
        return()=>{cancelAnimationFrame(refreshFrame);window.removeEventListener('resize',resize)}
      }
      gsap.set(rays,{strokeDasharray:1,strokeDashoffset:1,opacity:0})
      gsap.set([pulse,point,...Array.from(dots)],{opacity:0});gsap.set(statement,{autoAlpha:0,y:24})
      const master=gsap.timeline({scrollTrigger:{id:'hand-finale',trigger:track,start:'top top',end:'bottom bottom',pin:view,pinSpacing:false,scrub:.55,anticipatePin:1,invalidateOnRefresh:true},onUpdate:()=>{el.dataset.progress=master.progress().toFixed(4)}})
      // The two image-space anchors share one point. Entry rotation pivots around each fingertip.
      gsap.set(human,{transformOrigin:`${HAND_ASSETS.human.tip[0]*100}% ${HAND_ASSETS.human.tip[1]*100}%`})
      gsap.set(robot,{transformOrigin:`${HAND_ASSETS.robot.tip[0]*100}% ${HAND_ASSETS.robot.tip[1]*100}%`})
      master.fromTo(human,{x:()=>layout().hands.human.x-view.clientWidth*.55,y:()=>layout().hands.human.y+view.clientHeight*.06,rotation:-5},{...place('human'),duration:.50,ease:'power2.out'},0)
        .fromTo(robot,{x:()=>layout().hands.robot.x+view.clientWidth*.55,y:()=>layout().hands.robot.y-view.clientHeight*.04,rotation:5},{...place('robot'),duration:.50,ease:'power2.out'},0)
        .to(cue,{autoAlpha:0,duration:.14},.20)
        .to(point,{opacity:1,duration:.035},.50)
        .fromTo(pulse,{scale:.3,opacity:0},{scale:1,opacity:.65,duration:.065,ease:'power1.out'},.50)
        .to(pulse,{scale:2.1,opacity:0,duration:.16,ease:'power1.out'},.565)
        .to(rays,{strokeDashoffset:0,opacity:.7,duration:.24,stagger:.009,ease:'power2.out'},.54)
        .fromTo(hands,{y:0},{y:()=>-view.clientHeight*.11,duration:.20,ease:'power1.inOut'},.64)
        .to(statement,{autoAlpha:1,y:0,duration:.20,ease:'power2.out'},.71)
        .to(rays,{opacity:.26,duration:.13},.85)
        .to({}, {duration:.09},.91)
      dots.forEach((dot,index)=>{
        const [x,y]=particles[index]
        master.fromTo(dot,{x:0,y:0,opacity:0},{x,y,opacity:.7,duration:.17,ease:'power1.out'},.54+index*.012)
          .to(dot,{opacity:0,duration:.10},.72+index*.012)
      })
      const refreshFrame=requestAnimationFrame(()=>ScrollTrigger.refresh())
      return()=>{cancelAnimationFrame(refreshFrame);master.scrollTrigger?.kill(true);master.kill()}
    },view)
    return()=>{media.revert();delete el.dataset.layout;delete el.dataset.progress}
  },[assets==='failed'])
  return <section className="hand-finale" id="human-machine-finale" ref={root} data-assets={assets} aria-label="Con người và công nghệ — điểm chạm cuối hành trình">
    <div className="finale-runway" ref={runway}>
      <div className="finale-stage" ref={stage}>
        <p className="finale-label">MẠCH VƯƠN MÌNH <span>/</span> CON NGƯỜI × CÔNG NGHỆ</p>
        <div className="finale-hands" aria-hidden="true">
          <img className="finale-hand finale-human" src={assets==='ready'?HAND_ASSETS.human.src:undefined} width={1680} height={840} alt="" decoding="async" draggable={false}/>
          <img className="finale-hand finale-robot" src={assets==='ready'?HAND_ASSETS.robot.src:undefined} width={1680} height={700} alt="" decoding="async" draggable={false}/>
          <svg className="finale-signal" viewBox="-610 -180 1220 360" fill="none">
            {threads.map((d,i)=><path key={d} className="finale-thread" d={d} pathLength="1" strokeWidth={i===2||i===5?2:1}/>)}
            {particles.map((_,i)=><circle key={i} className="finale-particle" r={i%3===0?2.6:1.6} fill="currentColor"/>) }
          </svg>
          <i className="finale-pulse"/><i className="finale-contact"/>
        </div>
        <p className="finale-scroll-cue">CUỘN ĐỂ HAI BÀN TAY CHẠM NHAU <span>↓</span></p>
        <h2 className="finale-statement"><span>CON NGƯỜI TẠO RA CÔNG NGHỆ.</span><span>CÔNG NGHỆ MỞ RA<br className="finale-mobile-break"/> SỨC SẢN XUẤT MỚI.</span></h2>
        <span className="finale-end-line" aria-hidden="true"/>
      </div>
    </div>
    <div className="finale-after"><span>MẠCH VƯƠN MÌNH</span><button type="button" onClick={()=>goToScene(0)}>VỀ ĐẦU HÀNH TRÌNH <span>↑</span></button></div>
  </section>
}

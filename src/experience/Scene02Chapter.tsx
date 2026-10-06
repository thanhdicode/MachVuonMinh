import {useCallback,useEffect,useRef,useState} from 'react'
import {ScrollTrigger} from 'gsap/ScrollTrigger'
import {scene02State} from './scene02State'
import {useWorld} from './WorldState'
import {goToScene,scrollLeaseCounts,scrollToPosition} from './WorldTimeline'
import './scene02.css'

/** Local authored document, isolated like ThreeUI's LandingPageFrame. */
export function Scene02Chapter({onSource}:{onSource:(index:number)=>void}){
  const root=useRef<HTMLElement>(null),frame=useRef<HTMLIFrameElement>(null)
  const active=useWorld(s=>s.machine),reduced=useWorld(s=>s.reduced)
  const [mounted,setMounted]=useState(false),[height,setHeight]=useState(2400)
  const activeRef=useRef(active),sourceRef=useRef(onSource)
  activeRef.current=active;sourceRef.current=onSource
  const syncFrame=useCallback(()=>{
    const target=frame.current?.contentWindow;if(!target)return
    target.postMessage({channel:'mln111-sketchbook-host',type:'viewport',height:innerHeight},location.origin)
    if(activeRef.current)target.postMessage({channel:'mln111-sketchbook-host',type:'enter'},location.origin)
  },[])
  useEffect(()=>{
    const el=root.current;if(!el)return
    scene02State.static=true
    const near=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting))setMounted(true)},{rootMargin:'900px'})
    near.observe(el)
    return()=>near.disconnect()
  },[])
  useEffect(()=>{if(active)setMounted(true);syncFrame()},[active,syncFrame])
  useEffect(()=>{
    let wheelTarget=scrollY,lastWheel=0,refreshFrame=0
    const handle=(event:MessageEvent)=>{
      if(event.origin!==location.origin||event.source!==frame.current?.contentWindow||event.data?.channel!=='mln111-sketchbook')return
      const {type}=event.data,el=root.current;if(!el)return
      if(type==='ready'){syncFrame();return}
      if(type==='height'){
        const value=event.data.height
        if(Number.isFinite(value)&&value>=innerHeight*.5&&value<=12000){setHeight(Math.ceil(value));cancelAnimationFrame(refreshFrame);refreshFrame=requestAnimationFrame(()=>ScrollTrigger.refresh())}
        return
      }
      if(Object.values(scrollLeaseCounts()).some(n=>n>0))return
      // The iframe can be under the pointer before the chapter becomes active.
      // Keep wheel scrolling available across both chapter boundaries.
      if(!activeRef.current&&type!=='wheel')return
      if(type==='source'&&Number.isInteger(event.data.index)&&event.data.index>=0&&event.data.index<5)sourceRef.current(event.data.index)
      if(type==='next')goToScene(3)
      if(type==='anchor'&&Number.isFinite(event.data.top))scrollToPosition(el.offsetTop+Math.max(0,event.data.top-110))
      if(type==='wheel'&&Number.isFinite(event.data.delta)){
        const now=performance.now();if(now-lastWheel>160)wheelTarget=scrollY
        lastWheel=now;wheelTarget=Math.max(0,Math.min(document.documentElement.scrollHeight-innerHeight,wheelTarget+Math.max(-1200,Math.min(1200,event.data.delta))))
        scrollToPosition(wheelTarget)
      }
    }
    const scroll=()=>{const el=root.current;if(el)scene02State.progress=Math.max(0,Math.min(1,(scrollY-el.offsetTop)/Math.max(1,el.offsetHeight-innerHeight)))}
    addEventListener('message',handle);addEventListener('resize',syncFrame);addEventListener('scroll',scroll,{passive:true})
    return()=>{cancelAnimationFrame(refreshFrame);removeEventListener('message',handle);removeEventListener('resize',syncFrame);removeEventListener('scroll',scroll)}
  },[syncFrame])
  return <section ref={root} className="scene02-insertion scene02-notebook" aria-label="02 / Sổ tay Việt Nam" style={{height}}>
    <div className="notebook-guide-target" data-guide="machine-system" aria-hidden="true"/>
    {mounted?<iframe key={String(reduced)} ref={frame} src={`/scene02-sketchbook/index.html?nointro${reduced?'&reduced=1':''}`} title="Sổ tay Việt Nam — chín trang về sản xuất hôm nay" onLoad={syncFrame} className="scene02-notebook-frame" sandbox="allow-scripts allow-same-origin"/>:<div className="notebook-loading"><span>02 / VIỆT NAM HÔM NAY</span><p>Sổ tay Việt Nam</p></div>}
  </section>
}

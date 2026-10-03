import {useLayoutEffect,useRef} from 'react'
import gsap from 'gsap'
import {ScrollTrigger} from 'gsap/ScrollTrigger'
import {MotionPathPlugin} from 'gsap/MotionPathPlugin'
import {useWorld} from './WorldState'
import {machineBeat,machineState} from './machineState'
import './machine.css'
gsap.registerPlugin(ScrollTrigger,MotionPathPlugin)
const captions=['','MỘT NGUỒN LỰC.','MỘT CỖ MÁY.','NĂNG LƯỢNG KHÔNG CÒN DỪNG Ở MỘT MÁY.','MỘT MÁY THÀNH NHIỀU MÁY.','MỘT CÔNG VIỆC THÀNH NHIỀU CÔNG ĐOẠN.','MÁY MÓC MỞ RỘNG QUY MÔ.','TỔ CHỨC SẢN XUẤT PHẢI ĐỔI THEO.','KHI TRUYỀN ĐỘNG CƠ KHÍ TRỞ THÀNH TÍN HIỆU...']
const explanation='Khi công cụ, quy mô và mức độ liên kết của LLSX thay đổi, cách con người tổ chức sản xuất không thể đứng yên.'
function StaticHall({beat}:{beat:number}){
  return <div className={`hall-static-frame hall-frame-${beat}`} aria-hidden="true"><img src={`/images/machine-hall/frame-${['power','shaft','machines','system'][beat]}.webp`} alt="" loading="lazy"/><div className="hall-static-shade"/></div>
}
export function MachineChapter(){
  const root=useRef<HTMLElement>(null),stageRef=useRef<HTMLDivElement>(null),reduced=useWorld(s=>s.reduced)
  useLayoutEffect(()=>{
    const el=root.current,stage=stageRef.current;if(!el||!stage)return
    const media=gsap.matchMedia()
    media.add('(min-width:768px) and (prefers-reduced-motion:no-preference)',()=>{
      machineState.static=false;el.dataset.layout='pinned'
      const proxy={p:0},material={x:760,y:435},items=Array.from(stage.querySelectorAll<HTMLElement>('.hall-caption')),q=gsap.utils.selector(stage)
      let previous=-1
      const story=gsap.timeline({scrollTrigger:{id:'machine-chapter',trigger:el,start:'top top',end:()=>`+=${innerHeight*2.8}`,pin:stage,scrub:.9,anticipatePin:1,invalidateOnRefresh:true,onRefresh:self=>{stage.dataset.start=String(self.start);stage.dataset.end=String(self.end)}},defaults:{ease:'none'},onUpdate:()=>{
        const p=proxy.p,beat=machineBeat(p)
        machineState.progress=p;machineState.staticBeat=p<.24?0:p<.52?1:p<.78?2:3
        machineState.materialX=material.x;machineState.materialY=material.y
        stage.dataset.progress=p.toFixed(4);stage.dataset.beat=String(beat);stage.dataset.tone=p<.12?'paper':'steel'
        if(previous!==beat){previous=beat;items.forEach((item,i)=>{item.setAttribute('aria-hidden',String(i!==beat));gsap.set(item,{autoAlpha:i===beat?1:0})})}
      }})
      story.to(proxy,{p:1,duration:1},0)
        .fromTo(q('.hall-paper'),{opacity:1},{opacity:0,duration:.18},0)
        .fromTo(q('.hall-entry-circle'),{opacity:.7},{opacity:0,duration:.14},.02)
        .fromTo(q('.hall-technical-labels'),{autoAlpha:0},{autoAlpha:1,duration:.04},.28)
        .to(q('.hall-technical-labels'),{autoAlpha:0,duration:.05},.52)
        .fromTo(q('.hall-cadence'),{autoAlpha:0},{autoAlpha:1,duration:.06},.66)
        .to(q('.hall-cadence'),{autoAlpha:0,duration:.03},.78)
        .fromTo(q('.hall-explanation'),{autoAlpha:0},{autoAlpha:1,duration:.035},.905)
        .to(q('.hall-explanation'),{autoAlpha:0,duration:.025},.94)
        .to(material,{motionPath:{path:[{x:760,y:435},{x:980,y:445},{x:1080,y:435},{x:1230,y:400},{x:1430,y:365}],curviness:.2,autoRotate:false},duration:.36},.56)
      return ()=>{delete el.dataset.layout}
    })
    const readStatic=()=>{
      machineState.static=matchMedia('(max-width:767px),(prefers-reduced-motion:reduce)').matches
      if(!machineState.static)return
      const sections=Array.from(el.querySelectorAll<HTMLElement>('[data-static-beat]')),current=sections.reduce((best,node)=>Math.abs(node.getBoundingClientRect().top-125)<Math.abs(best.getBoundingClientRect().top-125)?node:best,sections[0])
      if(current&&el.getBoundingClientRect().top<innerHeight&&el.getBoundingClientRect().bottom>0){machineState.staticBeat=Number(current.dataset.staticBeat);machineState.progress=[.15,.4,.66,.9][machineState.staticBeat]}
    }
    readStatic();window.addEventListener('scroll',readStatic,{passive:true});window.addEventListener('resize',readStatic)
    return ()=>{window.removeEventListener('scroll',readStatic);window.removeEventListener('resize',readStatic);media.revert()}
  },[])
  return <section ref={root} className={`machine-insertion ${reduced?'machine-reduced':''}`} aria-label="02 / BƯỚC NGOẶT CƠ GIỚI">
    <div className="machine-stage" ref={stageRef} data-guide="machine-system" data-progress="0" data-beat="0">
      <div className="hall-room-underlay" aria-hidden="true"/>
      <div className="hall-paper" aria-hidden="true"><img src="/images/history/e-reconstruction-archive.webp" alt=""/><svg className="hall-entry-circle" viewBox="0 0 1600 900"><circle cx="800" cy="450" r="296"/><circle cx="800" cy="450" r="44"/><path d="M0 730C320 730 460 750 505 450A296 296 0 1 1 800 746"/><path d="M490 450H1110M800 140V760" className="hall-engraving"/></svg></div>
      <div className="hall-vignette" aria-hidden="true"/>
      <span className="machine-code">02 / BƯỚC NGOẶT CƠ GIỚI</span>
      <div className="hall-captions">{captions.map((text,i)=><div className={`hall-caption ${i<4?'caption-upper':'caption-lower'} caption-beat-${i}`} key={i} aria-hidden={i!==0}>{text&&<h2>{text}</h2>}</div>)}</div>
      <p className="hall-explanation">{explanation}</p>
      <div className="hall-technical-labels" aria-hidden="true"><span>TRỤC CHÍNH</span><span>DÂY TRUYỀN</span></div>
      <div className="hall-cadence" aria-hidden="true">PHÂN CÔNG <i/> PHỐI HỢP <i/> NHỊP SẢN XUẤT</div>
    </div>
    <div className="machine-static-story" data-guide="machine-system"><span className="machine-code">02 / BƯỚC NGOẶT CƠ GIỚI</span>{[0,1,2,3].map(i=><section className={`machine-static-beat static-beat-${i}`} data-static-beat={i} key={i}><StaticHall beat={i}/><span className="hall-static-index">{['01 / NGUỒN LỰC','02 / TRỤC CHÍNH','03 / CÔNG ĐOẠN','04 / TỔ CHỨC'][i]}</span><h2>{[captions[2],captions[3],captions[5],captions[7]][i]}</h2>{i===2&&<p>PHÂN CÔNG · PHỐI HỢP · NHỊP SẢN XUẤT</p>}{i===3&&<><p>{captions[6]}</p><p>{explanation}</p></>}</section>)}<p className="machine-static-exit">{captions[8]}</p></div>
    <ol className="machine-transcript">{captions.filter(Boolean).map(t=><li key={t}>{t}</li>)}<li>{explanation}</li><li>Một động cơ quay bánh đà và trục truyền động chung trên cao. Dây đai da dẫn lực xuống máy tiện, máy khoan và máy bào. Người vận hành ở từng vị trí và người bảo trì cùng giữ nhịp công việc; phôi thô đi qua nhiều công đoạn thành sản phẩm.</li></ol>
  </section>
}

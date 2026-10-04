import {useEffect,useLayoutEffect,useRef,useState,type PointerEvent as ReactPointerEvent,type KeyboardEvent} from 'react'
import gsap from 'gsap'
import {ScrollTrigger} from 'gsap/ScrollTrigger'
import {accessResponse,flowBeat,flowReveal,flowState,splitterResponse,updateFlow} from './scene07State'
import {scene07Audio} from './Scene07AudioEngine'
import {useWorld,timeline} from './WorldState'
import './scene07.css'

const humans=['worker','owner','engineer']
const names=['Người kỹ thuật viên','Người chủ xưởng','Người kỹ sư dữ liệu']
const labels=['TỔ CHỨC — QUẢN LÝ','SỞ HỮU','PHÂN PHỐI']
const questions=['NẾU CÔNG VIỆC ĐỔI TRƯỚC KỸ NĂNG?','DỮ LIỆU TẠO RA GIÁ TRỊ. AI CÓ QUYỀN KHAI THÁC NÓ?','NĂNG SUẤT TĂNG. GIÁ TRỊ MỚI ĐI VỀ ĐÂU?']
const bodies=[
  'Công nghệ có thể đổi vai trò của người lao động rất nhanh. Tổ chức sản xuất phải tạo đường chuyển từ thao tác sang kỹ năng mới.',
  'Khi dữ liệu trở thành đầu vào của sản xuất, quyền truy cập, sử dụng và chia sẻ không còn là chuyện kỹ thuật thuần túy.',
  'Năng suất cao hơn không tự trả lời cách thành quả được chia sẻ. Phân phối quyết định ai thực sự hưởng lợi từ năng lực sản xuất mới.',
]
const accessNames=['PRIVATE','SHARED','CONTROLLED ACCESS']

function PhysicalControl({kind,staticMode=false}:{kind:'work'|'key'|'splitter';staticMode?:boolean}){
  const [revision,setRevision]=useState(0),drag=useRef<{id:number;x:number;value:number;changed:boolean}|null>(null)
  useEffect(()=>{const update=()=>setRevision(flowState.revision);document.addEventListener('scene07-input',update);return()=>document.removeEventListener('scene07-input',update)},[])
  const value=()=>kind==='work'?flowState.work:kind==='key'?flowState.access/2:flowState.split
  const change=(v:number)=>{updateFlow(kind==='work'?{work:v}:kind==='key'?{access:v*2}:{split:v});scene07Audio.gesture(kind)}
  const key=(e:KeyboardEvent<HTMLButtonElement>)=>{
    if(['ArrowLeft','ArrowDown','ArrowRight','ArrowUp','Home','End','Enter',' '].includes(e.key)){
      e.preventDefault();const v=value();change(e.key==='Home'?0:e.key==='End'?1:e.key==='Enter'||e.key===' '?(v>=.99?0:v+(kind==='key'?.5:.34)):v+(['ArrowRight','ArrowUp'].includes(e.key)?1:-1)*(kind==='key'?.5:.1))
    }
  }
  const down=(e:ReactPointerEvent<HTMLButtonElement>)=>{drag.current={id:e.pointerId,x:e.clientX,value:value(),changed:false};e.currentTarget.setPointerCapture(e.pointerId)}
  const move=(e:ReactPointerEvent<HTMLButtonElement>)=>{if(!drag.current||drag.current.id!==e.pointerId)return;const delta=(e.clientX-drag.current.x)/(kind==='key'?180:220);if(Math.abs(delta)>.025){drag.current.changed=true;change(drag.current.value+delta)}}
  const up=(e:ReactPointerEvent<HTMLButtonElement>)=>{if(!drag.current)return;const d=drag.current;drag.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);if(!d.changed)change(value()>=.99?0:value()+(kind==='key'?.5:.34))}
  const current=kind==='work'?(flowState.work>.5?'Giám sát / kiểm soát / cải tiến':'Thao tác / kiểm tra'):kind==='key'?accessNames[flowState.access]:splitterResponse(flowState.split)
  return <div className={`flow-physical flow-${kind} ${staticMode?'physical-static':''}`} data-revision={revision}>
    <button className="flow-touch" data-kind={kind} data-guide={kind==='work'?'policy-instruction policy-skills policy-retry':kind==='key'?'policy-data-rights policy-data-governance policy-sandbox':'policy-reward policy-sockets'}
      aria-label={`${kind==='work'?'Tay kéo đỏ đổi công việc':kind==='key'?'Chìa khóa kính đổi quyền truy cập':'Tay chia dòng giá trị'}. ${current}. Kéo ngang hoặc dùng phím mũi tên, Enter để thay đổi.`}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={()=>{drag.current=null}} onLostPointerCapture={()=>{drag.current=null}} onKeyDown={key} onClick={e=>{if(e.detail===0)change(value()>=.99?0:value()+(kind==='key'?.5:.34))}}>
      <span className={`physical-icon icon-${kind}`} style={{transform:`rotate(${(value()-.5)*45}deg)`}} aria-hidden="true"/>
    </button>
    <span className="flow-touch-hint">{kind==='work'?'KÉO TAY ĐỎ':kind==='key'?'DI CHUYỂN CHÌA KHÓA':'XOAY TAY CHIA'} <small>kéo ngang · chạm · ← →</small></span>
  </div>
}

function StoryDetails({index}:{index:number}){
  const [revision,setRevision]=useState(0)
  useEffect(()=>{const sync=()=>setRevision(flowState.revision);document.addEventListener('scene07-input',sync);return()=>document.removeEventListener('scene07-input',sync)},[])
  return <div className={`flow-story-details detail-${index}`} data-revision={revision}>
    {index===0?<><div className="flow-task-ribbon"><span style={{opacity:1-flowState.work*.8}}>LẶP LẠI</span><i/><span>KIỂM TRA</span><i/><span style={{opacity:.35+flowState.work*.65}}>GIÁM SÁT</span><i/><span style={{opacity:.25+flowState.work*.75}}>XỬ LÝ SỰ CỐ</span></div><p className="flow-response" aria-live="polite">{flowState.work>.5?'Người ở lại. Công việc chuyển sang giám sát, kiểm soát và cải tiến.':'Dây chuyền tăng nhịp. Người vẫn đang thao tác và kiểm tra.'}</p></>:index===1?<><div className="flow-data-sources"><span>MÁY</span><span>ĐƠN HÀNG</span><span>VẬN HÀNH</span><span>KHÁCH HÀNG</span></div><div className="flow-gate-states">{accessNames.map((name,i)=><span key={name} className={flowState.access===i?'active':''}>{name}</span>)}</div><p className="flow-response" aria-live="polite">{accessResponse(flowState.access)}</p></>:<><div className="flow-value-destinations"><span className={flowState.split<.34?'active':''}>THU NHẬP LAO ĐỘNG</span><span data-guide="policy-infrastructure" className={flowState.split>=.34&&flowState.split<=.66?'active':''}>TÁI ĐẦU TƯ</span><span data-guide="policy-inclusion" className={flowState.split>.66?'active':''}>ĐỔI MỚI / NĂNG LỰC MỚI</span></div><p className="flow-response" aria-live="polite">{splitterResponse(flowState.split)}</p></>}
  </div>
}

export function Scene07Chapter(){
  const root=useRef<HTMLElement>(null),stage=useRef<HTMLDivElement>(null)
  const [beat,setBeat]=useState(0),[enabled,setEnabled]=useState(false),[error,setError]=useState('')
  const active=useWorld(s=>s.active===7),paused=useWorld(s=>s.paused),sound=useWorld(s=>s.sound)
  const preload=useWorld(s=>s.active===6||s.active===7)
  const enabledRef=useRef(false),activeRef=useRef(active);activeRef.current=active
  useEffect(()=>{if(preload)void scene07Audio.preload()},[preload])
  useLayoutEffect(()=>{
    const media=gsap.matchMedia(),el=root.current!,view=stage.current!
    media.add('(min-width:768px) and (prefers-reduced-motion:no-preference)',()=>{
      flowState.static=false;el.dataset.layout='pinned'
      const playhead={progress:0}
      const master=gsap.timeline({scrollTrigger:{id:'scene07-flow',trigger:el,start:'top top',end:'bottom bottom',pin:view,pinSpacing:false,scrub:.8,invalidateOnRefresh:true,anticipatePin:1,refreshPriority:-1},onUpdate:()=>{
        flowState.progress=playhead.progress;flowState.beat=flowBeat(playhead.progress)
        view.dataset.progress=playhead.progress.toFixed(4);view.dataset.beat=String(flowState.beat);view.dataset.reveal=String(flowReveal(playhead.progress))
        setBeat(b=>b===flowState.beat?b:flowState.beat)
        view.style.setProperty('--story-progress',String(playhead.progress))
        view.style.setProperty('--question-opacity',String(flowState.beat===1?gsap.utils.clamp(0,1,(playhead.progress-.2)/.04):flowState.beat===2?gsap.utils.clamp(0,1,(playhead.progress-.46)/.04):gsap.utils.clamp(0,1,(playhead.progress-.72)/.04)))
      }})
      master.to(playhead,{progress:1,duration:1,ease:'none'})
      return()=>{master.scrollTrigger?.kill(true);master.kill()}
    })
    media.add('(max-width:767px), (prefers-reduced-motion:reduce)',()=>{
      flowState.static=true;el.dataset.layout='vertical'
      const triggers=Array.from(el.querySelectorAll<HTMLElement>('.flow-static-act')).map((act,i)=>ScrollTrigger.create({trigger:act,start:'top 55%',end:'bottom 55%',onEnter:()=>{flowState.beat=i;flowState.progress=[.06,.3,.56,.8,.98][i];setBeat(i)},onEnterBack:()=>{flowState.beat=i;flowState.progress=[.06,.3,.56,.8,.98][i];setBeat(i)}}))
      return()=>triggers.forEach(t=>t.kill())
    })
    return()=>media.revert()
  },[])
  useEffect(()=>{
    const sync=()=>{flowState.active=activeRef.current;scene07Audio.sync({active:activeRef.current,paused:useWorld.getState().paused,hidden:document.hidden,beat:flowState.beat,progress:flowState.progress,velocity:timeline.velocity});const d=scene07Audio.diagnostics();if(enabledRef.current!==d.enabled){enabledRef.current=d.enabled;setEnabled(d.enabled)}if(stage.current){stage.current.dataset.audioContext=d.state;stage.current.dataset.audioRms=String(d.rms)}}
    const timer=window.setInterval(sync,100);document.addEventListener('visibilitychange',sync);sync()
    return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',sync);scene07Audio.stop()}
  },[])
  useEffect(()=>{if(!sound&&enabledRef.current){scene07Audio.stop();enabledRef.current=false;setEnabled(false)}},[sound])
  useEffect(()=>{scene07Audio.sync({active,paused,hidden:document.hidden,beat,progress:flowState.progress,velocity:timeline.velocity})},[active,paused,beat])
  const toggle=async()=>{
    setError('');if(enabledRef.current){scene07Audio.stop();enabledRef.current=false;setEnabled(false);useWorld.getState().set({sound:false});return}
    const started=await scene07Audio.start();enabledRef.current=started;setEnabled(started)
    if(started)useWorld.getState().set({sound:true});else setError('Âm thanh chưa khởi động. Chạm để thử lại.')
  }
  return <section ref={root} className="flow-insertion" aria-label="07 / Ba đời sống — một hệ thống">
    <div className="flow-stage" ref={stage} data-beat={beat} data-reveal="false">
      <div className="flow-light-wrap" aria-hidden="true"/>
      <span className="flow-code">07 / THREE LIVES — ONE SYSTEM</span>
      <div className="flow-arrival" aria-hidden={beat!==0}><span>01 / MỘT DÒNG GIÁ TRỊ</span><h2>MỘT CÔNG NGHỆ MỚI.<br/>BA ĐỜI SỐNG<br/>BỊ TÁC ĐỘNG.</h2><p>Đi theo dòng đỏ. Nhìn công việc, dữ liệu và thành quả thay đổi.</p></div>
      <div className={`flow-portraits portraits-beat-${beat}`} aria-hidden="true">{humans.map((id,i)=><figure className={`flow-portrait portrait-${i}`} key={id}><img src={`/images/scene07/${id}.webp`} alt=""/><figcaption>{String(i+1).padStart(2,'0')} / {names[i]}</figcaption></figure>)}</div>
      {[0,1,2].map(i=><div className={`flow-act act-${i+1}`} key={i} aria-hidden={beat!==i+1} inert={beat!==i+1}>
        <div className="flow-story-copy"><span className="flow-person-code">{String(i+1).padStart(2,'0')} / {names[i]}</span><h2 className="flow-question">{questions[i]}</h2><p className="flow-theory-body">{bodies[i]}</p><strong className="flow-theory-label">{labels[i]}</strong></div>
        <StoryDetails index={i}/><PhysicalControl kind={['work','key','splitter'][i] as 'work'|'key'|'splitter'}/>
      </div>)}
      <div className="flow-collective" data-guide="policy-result" aria-hidden={beat!==4}><div className="flow-final-labels"><span>SỞ HỮU</span><span>TỔ CHỨC — QUẢN LÝ</span><span>PHÂN PHỐI</span></div><h2><span>CÔNG NGHỆ CÓ THỂ ĐỔI RẤT NHANH.</span><span className="flow-last-thesis">QUAN HỆ SẢN XUẤT PHẢI BIẾT THÍCH ỨNG.</span></h2><p>Sở hữu. Tổ chức. Phân phối. Ba câu hỏi không thể đứng yên khi lực lượng sản xuất tiếp tục vận động.</p></div>
      <span className="flow-art-credit">Nhân vật tổng hợp · Minh họa được tạo</span>
    </div>
    <div className="flow-static-story">
      <section className="flow-static-act flow-static-arrival" data-flow-act="0"><span className="flow-person-code">07 / BA ĐỜI SỐNG — MỘT HỆ THỐNG</span><h2>MỘT CÔNG NGHỆ MỚI.<br/>BA ĐỜI SỐNG BỊ TÁC ĐỘNG.</h2><div className="flow-static-triptych">{humans.map(id=><img key={id} src={`/images/scene07/${id}.webp`} alt="" loading="lazy"/>)}</div><p>Đi theo dòng đỏ qua công việc, dữ liệu và giá trị.</p><span className="flow-static-credit">Nhân vật tổng hợp · Minh họa được tạo</span></section>
      {[0,1,2].map(i=><section className="flow-static-act" data-flow-act={i+1} key={i}><span className="flow-person-code">{String(i+1).padStart(2,'0')} / {names[i]}</span><img className="flow-static-portrait" src={`/images/scene07/${humans[i]}.webp`} alt={`${names[i]} bên ${['dây chuyền tự động','bàn làm việc trong xưởng nhỏ','máy tính kết nối sản xuất'][i]}. Nhân vật tổng hợp.`} loading="lazy"/><svg className="flow-static-thread" viewBox="0 0 350 80" aria-hidden="true"><path d="M-20 60C65 60 80 8 145 22S220 80 260 35S320 20 370 55"/></svg><StoryDetails index={i}/><PhysicalControl kind={['work','key','splitter'][i] as 'work'|'key'|'splitter'} staticMode/><h2>{questions[i]}</h2><p>{bodies[i]}</p><strong className="flow-static-label">{labels[i]}</strong></section>)}
      <section className="flow-static-act flow-static-finale" data-flow-act="4" data-guide="policy-result"><div className="flow-static-triptych">{humans.map(id=><img key={id} src={`/images/scene07/${id}.webp`} alt="" loading="lazy"/>)}</div><div className="flow-final-labels"><span>SỞ HỮU</span><span>TỔ CHỨC — QUẢN LÝ</span><span>PHÂN PHỐI</span></div><h2>CÔNG NGHỆ CÓ THỂ ĐỔI RẤT NHANH.</h2><h2>QUAN HỆ SẢN XUẤT PHẢI BIẾT THÍCH ỨNG.</h2><p>Sở hữu. Tổ chức. Phân phối. Ba câu hỏi không thể đứng yên khi lực lượng sản xuất tiếp tục vận động.</p></section>
    </div>
    {active&&<div className="flow-sound-dock"><button aria-pressed={enabled} onClick={toggle}>ÂM THANH {enabled?'BẬT':'TẮT'} <span aria-hidden="true">{enabled?'◖))':'◖×'}</span></button>{error&&<span role="status">{error}</span>}</div>}
  </section>
}
